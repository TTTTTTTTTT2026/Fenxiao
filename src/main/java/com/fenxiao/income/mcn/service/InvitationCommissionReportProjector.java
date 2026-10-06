package com.fenxiao.income.mcn.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

/** Transactional read model for consumer commission reports. No report read touches the accounting ledger. */
@Service
public class InvitationCommissionReportProjector {
    private final JdbcTemplate jdbc;

    public InvitationCommissionReportProjector(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void recordLedger(long ledgerId) {
        List<Event> events = jdbc.query("""
                SELECT l.user_id,l.platform_code,l.created_at,l.source_user_id,l.reward_level,
                       l.frozen_delta+l.available_delta,
                       CASE WHEN l.reward_level=1 THEN l.source_user_id ELSE COALESCE((
                           SELECT r.inviter_user_id FROM invitation_relation_version r
                           WHERE r.user_id=l.source_user_id AND r.effective_from<=e.occurred_at
                             AND (r.effective_to IS NULL OR r.effective_to>e.occurred_at)
                           ORDER BY r.version_no DESC LIMIT 1
                       ),0) END
                FROM invitation_reward_account_ledger l
                JOIN invitation_reward_entry e ON e.id=l.entry_id
                WHERE l.id=? AND l.reward_level IN (1,2)
                  AND l.event_type IN ('INVITATION_REWARD','MCN_INCREASE','MCN_REVISION')
                """, (rs, row) -> new Event(rs.getLong(1), rs.getString(2),
                LocalDate.ofInstant(rs.getTimestamp(3).toInstant(), ZoneOffset.UTC), rs.getLong(4),
                rs.getInt(5), rs.getBigDecimal(6), rs.getLong(7)), ledgerId);
        if (events.isEmpty()) return; // UNFREEZE is a transfer, not new commission.
        Event event = events.getFirst();
        List<Long> prior = jdbc.query("SELECT ledger_id FROM invitation_commission_report_event WHERE ledger_id=?",
                (rs, row) -> rs.getLong(1), ledgerId);
        if (!prior.isEmpty()) return;
        jdbc.update("""
                INSERT INTO invitation_commission_report_event
                (ledger_id,user_id,platform_code,report_date,direct_invitee_user_id,source_user_id,reward_level,points_delta)
                VALUES (?,?,?,?,?,?,?,?)
                """, ledgerId, event.userId(), event.platform(), event.day(), event.directInviteeUserId(),
                event.sourceUserId(), event.level(), event.points());
        jdbc.update("""
                INSERT INTO invitation_commission_report_daily
                (user_id,platform_code,report_date,direct_invitee_user_id,source_user_id,reward_level,points_delta)
                VALUES (?,?,?,?,?,?,?)
                ON DUPLICATE KEY UPDATE points_delta=points_delta+VALUES(points_delta)
                """, event.userId(), event.platform(), event.day(), event.directInviteeUserId(),
                event.sourceUserId(), event.level(), event.points());
    }

    private record Event(long userId, String platform, LocalDate day, long sourceUserId,
                         int level, BigDecimal points, long directInviteeUserId) { }
}
