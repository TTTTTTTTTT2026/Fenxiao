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
        if (actor.guildScope()!=null && !actor.guildScope().isBlank() && !actor.guildScope().equals("*"))
            throw new ForbiddenException("公会受限账号无法调整用户账户");
        if (user.getCountryCode()==null || user.getCountryCode().isBlank()) throw new ForbiddenException("用户归属国家未设置");
        actor.requireScope(platform,null,user.getCountryCode());
    }
    private record Prior(Result result, long actorId, String reason) { }
}
