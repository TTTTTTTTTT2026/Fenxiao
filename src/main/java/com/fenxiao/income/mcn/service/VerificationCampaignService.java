package com.fenxiao.income.mcn.service;

import com.fenxiao.admin.service.AdminSessionService.AdminPrincipal;
import com.fenxiao.common.api.ForbiddenException;
import com.fenxiao.audit.entity.OperationAuditLog;
import com.fenxiao.audit.repository.OperationAuditLogRepository;
import java.time.LocalDateTime;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/** Invitation verification awards are snapshotted when verification succeeds, not backfilled. */
@Service
public class VerificationCampaignService {
    private final JdbcTemplate jdbc;
    private final Clock clock;
    private final OperationAuditLogRepository audit;
    private final int freezeDays;

    public VerificationCampaignService(JdbcTemplate jdbc, Clock clock, OperationAuditLogRepository audit,
            @Value("${app.invitation-reward.freeze-days:7}") int freezeDays) {
        if (freezeDays < 1 || freezeDays > 365) throw new IllegalArgumentException("invalid freeze days");
        this.jdbc = jdbc; this.clock = clock; this.audit = audit; this.freezeDays = freezeDays;
    }
    public record Campaign(long id, String name, String platformCode, BigDecimal rewardPoints,
                           boolean enabled, Instant createdAt, Instant updatedAt) { }
    public record Award(long id, long campaignId, long invitedUserId, long inviterUserId, String platformCode,
                        BigDecimal rewardPoints, Instant verifiedAt, Instant awardedAt, Instant unlockAt, Instant releasedAt) { }
    private void authorize(AdminPrincipal actor) {
        if (actor == null || !"super_admin".equalsIgnoreCase(actor.role()) || !global(actor.platformScope())
                || !global(actor.regionScope()) || !global(actor.guildScope()))
            throw new ForbiddenException("活动管理需要全局超级管理员权限");
    }
    private boolean global(String scope) { return scope == null || scope.isBlank() || "*".equals(scope.trim()); }
    @Transactional(readOnly = true)
    public List<Campaign> campaigns(AdminPrincipal actor) {
        authorize(actor);
        return jdbc.query("SELECT id,name,platform_code,reward_points,enabled,created_at,updated_at FROM invitation_verification_campaign ORDER BY id DESC",
                (r,n)->new Campaign(r.getLong(1),r.getString(2),r.getString(3),r.getBigDecimal(4),r.getBoolean(5),r.getTimestamp(6).toInstant(),r.getTimestamp(7).toInstant()));
    }
    @Transactional
    public void setEnabled(long id, boolean enabled, AdminPrincipal actor) {
        authorize(actor);
        List<BigDecimal> current = jdbc.query("SELECT reward_points FROM invitation_verification_campaign WHERE id=? FOR UPDATE",(r,n)->r.getBigDecimal(1),id);
        if (current.isEmpty()) throw new IllegalArgumentException("活动不存在");
        if (enabled && current.getFirst().signum() <= 0) throw new IllegalArgumentException("请先设置大于 0 的奖励积分");
        int updated = jdbc.update("UPDATE invitation_verification_campaign SET enabled=?,updated_by=?,updated_at=? WHERE id=?",
                enabled,actor.accountId(),Timestamp.from(clock.instant()),id);
        if (updated != 1) throw new IllegalArgumentException("活动不存在");
        audit.save(OperationAuditLog.create(actor.accountId(),actor.role(),"verification_campaign","campaign",id,enabled?"ENABLE":"DISABLE",null,null,null,enabled?"开启活动":"关闭活动",LocalDateTime.now(clock)));
    }
    @Transactional
    public void updatePoints(long id, BigDecimal points, AdminPrincipal actor) {
        authorize(actor);
        if (points == null || points.signum() <= 0 || points.scale() > 6 || points.precision()-points.scale() > 12)
            throw new IllegalArgumentException("奖励积分无效");
        List<BigDecimal> prior=jdbc.query("SELECT reward_points FROM invitation_verification_campaign WHERE id=? FOR UPDATE",(r,n)->r.getBigDecimal(1),id);
        if (prior.isEmpty()) throw new IllegalArgumentException("活动不存在");
        jdbc.update("UPDATE invitation_verification_campaign SET reward_points=?,updated_by=?,updated_at=? WHERE id=?",points,actor.accountId(),Timestamp.from(clock.instant()),id);
        audit.save(OperationAuditLog.create(actor.accountId(),actor.role(),"verification_campaign","campaign",id,"UPDATE_POINTS",prior.getFirst().toPlainString(),points.toPlainString(),null,"修改活动奖励积分",LocalDateTime.now(clock)));
    }
    @Transactional(readOnly = true)
    public List<Award> awards(AdminPrincipal actor) {
        authorize(actor);
        return jdbc.query("SELECT id,campaign_id,invited_user_id,inviter_user_id,platform_code,reward_points,verified_at,awarded_at,unlock_at,released_at FROM invitation_verification_campaign_award ORDER BY id DESC LIMIT 100",
                (r,n)->new Award(r.getLong(1),r.getLong(2),r.getLong(3),r.getLong(4),r.getString(5),r.getBigDecimal(6),r.getTimestamp(7).toInstant(),instant(r.getTimestamp(8)),instant(r.getTimestamp(9)),instant(r.getTimestamp(10))));
    }
    private static Instant instant(Timestamp time) { return time == null ? null : time.toInstant(); }

    /** Called inside the binding transaction only on an authoritative first success. */
    @Transactional
    public void capture(long userId, String platform) {
        Timestamp now=Timestamp.from(clock.instant());
        jdbc.update("""
            INSERT INTO invitation_verification_campaign_award(campaign_id,invited_user_id,inviter_user_id,platform_code,reward_points,verified_at)
            SELECT c.id,?,r.inviter_user_id,c.platform_code,c.reward_points,?
            FROM invitation_verification_campaign c JOIN invitation_relation_version r ON r.user_id=? AND r.version_no=1
            WHERE c.enabled=TRUE AND c.platform_code=? AND r.inviter_user_id IS NOT NULL AND r.inviter_user_id<>?
            """,userId,now,userId,platform,userId);
    }
    /** Each pending snapshot and corresponding account credit share one transaction. */
    @Transactional
    public int processPending() {
        List<Long> ids=jdbc.query("SELECT id FROM invitation_verification_campaign_award WHERE awarded_at IS NULL ORDER BY id LIMIT 200 FOR UPDATE",(r,n)->r.getLong(1));
        Instant now=clock.instant();
        for(long id:ids) {
            List<AwardOwner> owners=jdbc.query("SELECT inviter_user_id,reward_points FROM invitation_verification_campaign_award WHERE id=? AND awarded_at IS NULL",(r,n)->new AwardOwner(r.getLong(1),r.getBigDecimal(2)),id);
            if(owners.isEmpty()) continue;
            AwardOwner award=owners.getFirst();
            jdbc.update("INSERT INTO invitation_reward_account(user_id) VALUES (?) ON DUPLICATE KEY UPDATE user_id=user_id",award.userId());
            jdbc.queryForObject("SELECT user_id FROM invitation_reward_account WHERE user_id=? FOR UPDATE",Long.class,award.userId());
            jdbc.update("UPDATE invitation_reward_account SET frozen_points=frozen_points+?,updated_at=? WHERE user_id=?",award.points(),Timestamp.from(now),award.userId());
            jdbc.update("UPDATE invitation_verification_campaign_award SET awarded_at=?,unlock_at=? WHERE id=?",Timestamp.from(now),Timestamp.from(now.plusSeconds(freezeDays*86400L)),id);
        }
        return ids.size();
    }
    @Transactional
    public int releaseDue() {
        Instant now=clock.instant();
        List<Long> ids=jdbc.query("SELECT id FROM invitation_verification_campaign_award WHERE awarded_at IS NOT NULL AND released_at IS NULL AND unlock_at<=? ORDER BY unlock_at,id LIMIT 200 FOR UPDATE",(r,n)->r.getLong(1),Timestamp.from(now));
        for(long id:ids) {
            AwardOwner a=jdbc.queryForObject("SELECT inviter_user_id,reward_points FROM invitation_verification_campaign_award WHERE id=?",(r,n)->new AwardOwner(r.getLong(1),r.getBigDecimal(2)),id);
            jdbc.queryForObject("SELECT user_id FROM invitation_reward_account WHERE user_id=? FOR UPDATE",Long.class,a.userId());
            jdbc.update("UPDATE invitation_reward_account SET frozen_points=frozen_points-?,available_points=available_points+?,updated_at=? WHERE user_id=?",a.points(),a.points(),Timestamp.from(now),a.userId());
            jdbc.update("UPDATE invitation_verification_campaign_award SET released_at=? WHERE id=?",Timestamp.from(now),id);
        }
        return ids.size();
    }
    private record AwardOwner(long userId, BigDecimal points) { }
}
