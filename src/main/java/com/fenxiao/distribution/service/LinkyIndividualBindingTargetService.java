package com.fenxiao.distribution.service;

import com.fenxiao.admin.service.AdminSessionService.AdminPrincipal;
import com.fenxiao.audit.entity.OperationAuditLog;
import com.fenxiao.audit.repository.OperationAuditLogRepository;
import com.fenxiao.common.api.ForbiddenException;
import com.fenxiao.platform.mcn.McnLinkyVerificationProperties;
import com.fenxiao.user.repository.UserDistributionProfileRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/** A target for this user's own binding only; never changes the invitation route or bypasses MCN verification. */
@Service
public class LinkyIndividualBindingTargetService {
    private final JdbcTemplate jdbc;
    private final UserDistributionProfileRepository users;
    private final McnLinkyVerificationProperties properties;
    private final OperationAuditLogRepository audit;
    private final Clock clock;
    public LinkyIndividualBindingTargetService(JdbcTemplate jdbc, UserDistributionProfileRepository users,
            McnLinkyVerificationProperties properties, OperationAuditLogRepository audit, Clock clock) {
        this.jdbc=jdbc; this.users=users; this.properties=properties; this.audit=audit; this.clock=clock;
    }
    public record Target(long userId, String linkyAccount, String guildId, String guildName, String guildInviteCode, String reason) { }
    public record Request(String linkyAccount, String guildId, String guildInviteCode, String reason) { }
    @Transactional(readOnly=true)
    public Optional<Target> findForBinding(long userId, String linkyAccount) {
        var rows=jdbc.query("SELECT user_id,linky_account,guild_id,guild_name,guild_invite_code,change_reason FROM user_linky_binding_target_override WHERE user_id=?",
                (r,n)->new Target(r.getLong(1),r.getString(2),r.getString(3),r.getString(4),r.getString(5),r.getString(6)),userId);
        if(rows.isEmpty()) return Optional.empty();
        Target target=rows.getFirst();
        if (!target.linkyAccount().equals(linkyAccount)) throw new IllegalStateException("Linky binding target is configured for a different account; contact operations");
        return Optional.of(target);
    }
    @Transactional
    public Target set(long userId, Request req, AdminPrincipal actor, String ip) {
        if (actor==null || !"super_admin".equalsIgnoreCase(actor.role())) throw new ForbiddenException("仅超级管理员可设置本人绑定目标");
        var user=users.findById(userId).orElseThrow(()->new IllegalArgumentException("用户不存在"));
        if(req==null) throw new IllegalArgumentException("缺少配置");
        String account=clean(req.linkyAccount()), guild=clean(req.guildId()), invite=clean(req.guildInviteCode()), reason=clean(req.reason());
        if(!account.matches("^[0-9]{8}$") || !guild.matches("^[0-9]{8}$") || !properties.isAllowedGuildId(guild)
                || invite.length()>64 || reason.isEmpty() || reason.length()>255)
            throw new IllegalArgumentException("账号、公会、邀请码或原因无效");
        if(user.getCountryCode()==null || user.getCountryCode().isBlank()) throw new ForbiddenException("用户归属国家未设置");
        actor.requireScope("LINKY",guild,user.getCountryCode());
        List<String> names=jdbc.query("SELECT guild_name FROM platform_guild_directory WHERE platform_code='LINKY' AND external_guild_id=? AND directory_status='NORMAL' AND guild_status IN ('ACTIVE','ENABLED')",(r,n)->r.getString(1),guild);
        if(names.size()!=1) throw new IllegalArgumentException("目标公会不在启用的公会目录中");
        Integer used=jdbc.queryForObject("SELECT COUNT(*) FROM linky_account_binding WHERE (user_id=? OR linky_account=?) AND registration_eligibility='ELIGIBLE' AND user_id IS NOT NULL",Integer.class,userId,account);
        if(used!=null && used>0) throw new IllegalStateException("用户或账号已经绑定，不能设置本人绑定目标");
        List<Target> prior=jdbc.query("SELECT user_id,linky_account,guild_id,guild_name,guild_invite_code,change_reason FROM user_linky_binding_target_override WHERE user_id=? FOR UPDATE",
                (r,n)->new Target(r.getLong(1),r.getString(2),r.getString(3),r.getString(4),r.getString(5),r.getString(6)),userId);
        Timestamp now=Timestamp.from(clock.instant());
        jdbc.update("INSERT INTO user_linky_binding_target_override(user_id,linky_account,guild_id,guild_name,guild_invite_code,change_reason,changed_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE linky_account=VALUES(linky_account),guild_id=VALUES(guild_id),guild_name=VALUES(guild_name),guild_invite_code=VALUES(guild_invite_code),change_reason=VALUES(change_reason),changed_by=VALUES(changed_by),updated_at=VALUES(updated_at)",userId,account,guild,names.getFirst(),invite,reason,actor.accountId(),now,now);
        String before=prior.isEmpty()?null:"account="+prior.getFirst().linkyAccount()+",guild="+prior.getFirst().guildId();
        audit.save(OperationAuditLog.create(actor.accountId(),actor.role(),"linky_binding_target","user",userId,"SET_BINDING_TARGET",before,"account="+account+",guild="+guild,ip,reason,LocalDateTime.now(clock)));
        return new Target(userId,account,guild,names.getFirst(),invite,reason);
    }
    private static String clean(String value){return value==null?"":value.trim();}
}
