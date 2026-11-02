package com.fenxiao.income.mcn.service;

import com.fenxiao.admin.service.AdminSessionService;
import com.fenxiao.common.api.ForbiddenException;
import com.fenxiao.user.repository.UserDistributionProfileRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Clock;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.ArrayList;

/** Operator adjustments are distinct from income and update the same user balance atomically. */
@Service
public class ManualPointsAdjustmentService {
    private final JdbcTemplate jdbc;
    private final UserDistributionProfileRepository users;
    private final Clock clock;
    public ManualPointsAdjustmentService(JdbcTemplate jdbc, UserDistributionProfileRepository users, Clock clock) {
        this.jdbc=jdbc; this.users=users; this.clock=clock;
    }
    public record Request(String requestId, String platformCode, BigDecimal deltaPoints, String reason) { }
    public record Result(String requestId, long userId, String platformCode, BigDecimal deltaPoints,
                         BigDecimal beforeAvailable, BigDecimal afterAvailable) { }
    public record Preview(String platformCode, BigDecimal availablePoints) { }
    public record UserInfo(long userId, String nickname, String countryCode) { }
    public record Record(long id, long userId, String nickname, String countryCode, String platformCode,
                         BigDecimal deltaPoints, String reason, String actorName, BigDecimal beforeAvailable,
                         BigDecimal afterAvailable, java.time.Instant createdAt) { }
    public record RecordPage(List<Record> items, int page, int size, boolean hasMore) { }

    @Transactional(readOnly=true)
    public UserInfo userInfo(long userId, AdminSessionService.AdminPrincipal actor) {
        var user=users.findById(userId).orElseThrow(()->new IllegalArgumentException("用户不存在"));
        requireGlobalGuild(actor);
        if (user.getCountryCode()==null || user.getCountryCode().isBlank()) throw new ForbiddenException("用户归属国家未设置");
        actor.requireScope(null,null,user.getCountryCode());
        List<String> names=jdbc.query("SELECT nickname FROM user_public_profile WHERE user_id=?",(rs,n)->rs.getString(1),userId);
        return new UserInfo(userId,names.isEmpty()?null:names.getFirst(),user.getCountryCode());
    }

    @Transactional(readOnly=true)
    public RecordPage records(int requestedPage, AdminSessionService.AdminPrincipal actor) {
        requireGlobalGuild(actor);
        int page=Math.max(0,Math.min(requestedPage,10000)), size=20;
        List<Object> args=new ArrayList<>();
        String platform=scopeFilter("m.platform_code",actor.platformScope(),args);
        String country=scopeFilter("u.country_code",actor.regionScope(),args);
        args.add(size+1);args.add(page*size);
        List<Record> found=jdbc.query("SELECT m.id,m.user_id,p.nickname,u.country_code,m.platform_code,m.delta_points,m.reason,a.display_name,m.before_available,m.after_available,m.created_at FROM invitation_points_manual_adjustment m JOIN user_distribution_profile u ON u.user_id=m.user_id LEFT JOIN user_public_profile p ON p.user_id=m.user_id LEFT JOIN admin_account a ON a.id=m.actor_id WHERE 1=1"+platform+country+" ORDER BY m.id DESC LIMIT ? OFFSET ?",
                (rs,n)->new Record(rs.getLong(1),rs.getLong(2),rs.getString(3),rs.getString(4),rs.getString(5),rs.getBigDecimal(6),rs.getString(7),rs.getString(8),rs.getBigDecimal(9),rs.getBigDecimal(10),rs.getTimestamp(11).toInstant()),args.toArray());
        return new RecordPage(found.subList(0,Math.min(size,found.size())),page,size,found.size()>size);
    }
    private String scopeFilter(String column, String scope, List<Object> args) {
        if(scope==null || scope.isBlank() || scope.trim().equals("*")) return "";
        List<String> values=java.util.Arrays.stream(scope.split(",")).map(String::trim).filter(v->!v.isEmpty()).map(v->v.toUpperCase(Locale.ROOT)).toList();
        if(values.isEmpty()) return " AND 1=0";
        args.addAll(values);
        return " AND UPPER("+column+") IN ("+String.join(",",java.util.Collections.nCopies(values.size(),"?"))+")";
    }
    @Transactional(readOnly=true)
    public Preview preview(long userId, String platformValue, AdminSessionService.AdminPrincipal actor) {
        String platform=platformValue==null?"":platformValue.trim().toUpperCase(Locale.ROOT);
        if (!Set.of("TIMO","LINKY").contains(platform)) throw new IllegalArgumentException("请选择应用");
        authorize(userId,platform,actor);
        BigDecimal available=jdbc.queryForObject("SELECT COALESCE((SELECT SUM(available_delta) FROM invitation_reward_account_ledger WHERE user_id=? AND platform_code=?),0)+COALESCE((SELECT SUM(delta_points) FROM invitation_points_manual_adjustment WHERE user_id=? AND platform_code=?),0)",BigDecimal.class,userId,platform,userId,platform);
        return new Preview(platform,available);
    }
    @Transactional
    public Result adjust(long userId, Request request, AdminSessionService.AdminPrincipal actor) {
        if (request==null || request.requestId()==null) throw new IllegalArgumentException("缺少操作编号");
        try { UUID.fromString(request.requestId()); } catch (IllegalArgumentException ex) { throw new IllegalArgumentException("操作编号无效"); }
        String platform=request.platformCode()==null?"":request.platformCode().trim().toUpperCase(Locale.ROOT);
        if (!Set.of("TIMO","LINKY").contains(platform)) throw new IllegalArgumentException("请选择应用");
        BigDecimal delta=request.deltaPoints();
        if (delta==null || delta.signum()==0 || delta.scale()>6 || delta.precision()-delta.scale()>12)
            throw new IllegalArgumentException("积分数量无效");
        String reason=request.reason()==null?"":request.reason().trim();
        if (reason.isEmpty() || reason.length()>128) throw new IllegalArgumentException("请填写调整原因（最多128字）");
        authorize(userId,platform,actor);
        jdbc.update("INSERT INTO invitation_reward_account(user_id) VALUES (?) ON DUPLICATE KEY UPDATE user_id=user_id",userId);
        BigDecimal globalBefore=jdbc.queryForObject("SELECT available_points FROM invitation_reward_account WHERE user_id=? FOR UPDATE",BigDecimal.class,userId);
        List<Prior> prior=jdbc.query("SELECT request_id,user_id,platform_code,delta_points,before_available,after_available,actor_id,reason FROM invitation_points_manual_adjustment WHERE request_id=?",
                (rs,n)->new Prior(new Result(rs.getString(1),rs.getLong(2),rs.getString(3),rs.getBigDecimal(4),rs.getBigDecimal(5),rs.getBigDecimal(6)),rs.getLong(7),rs.getString(8)),request.requestId());
        if (!prior.isEmpty()) {
            Prior saved=prior.getFirst(); Result previous=saved.result();
            if (previous.userId()!=userId || saved.actorId()!=actor.accountId() || !saved.reason().equals(reason) || !previous.platformCode().equals(platform) || previous.deltaPoints().compareTo(delta)!=0)
                throw new IllegalArgumentException("操作编号已用于其他调整");
            return previous;
        }
        BigDecimal before=jdbc.queryForObject("SELECT COALESCE((SELECT SUM(available_delta) FROM invitation_reward_account_ledger WHERE user_id=? AND platform_code=?),0)+COALESCE((SELECT SUM(delta_points) FROM invitation_points_manual_adjustment WHERE user_id=? AND platform_code=?),0)",BigDecimal.class,userId,platform,userId,platform);
        BigDecimal after=before.add(delta);
        jdbc.update("INSERT INTO invitation_points_manual_adjustment(request_id,user_id,platform_code,delta_points,reason,actor_id,before_available,after_available,created_at) VALUES (?,?,?,?,?,?,?,?,?)",
                request.requestId(),userId,platform,delta,reason,actor.accountId(),before,after,Timestamp.from(clock.instant()));
        jdbc.update("UPDATE invitation_reward_account SET available_points=?,updated_at=? WHERE user_id=?",globalBefore.add(delta),Timestamp.from(clock.instant()),userId);
        return new Result(request.requestId(),userId,platform,delta,before,after);
    }
    private void authorize(long userId, String platform, AdminSessionService.AdminPrincipal actor) {
        var user=users.findById(userId).orElseThrow(()->new IllegalArgumentException("用户不存在"));
        requireGlobalGuild(actor);
        if (user.getCountryCode()==null || user.getCountryCode().isBlank()) throw new ForbiddenException("用户归属国家未设置");
        actor.requireScope(platform,null,user.getCountryCode());
    }
    private void requireGlobalGuild(AdminSessionService.AdminPrincipal actor) {
        if (actor.guildScope()!=null && !actor.guildScope().isBlank() && !actor.guildScope().trim().equals("*"))
            throw new ForbiddenException("公会受限账号无法调整用户账户");
    }
    private record Prior(Result result, long actorId, String reason) { }
}
