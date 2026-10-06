package com.fenxiao.income.mcn.service;

import com.fenxiao.income.mcn.api.dto.InvitationCommissionReportResponse;
import com.fenxiao.income.mcn.api.dto.InvitationCommissionSourceResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class InvitationCommissionReportService {
    private final JdbcTemplate jdbc;
    private final Clock clock;

    public InvitationCommissionReportService(JdbcTemplate jdbc, Clock clock) {
        this.jdbc = jdbc;
        this.clock = clock;
    }

    public InvitationCommissionReportResponse report(long userId, String platform, LocalDate start, LocalDate end,
                                                      int page, int size) {
        Window window = window(start, end, page, size);
        Object[] scope = {userId, platform, start, end.plusDays(1)};
        BigDecimal[] totals = jdbc.queryForObject("""
                SELECT COALESCE(SUM(CASE WHEN reward_level=1 THEN points_delta ELSE 0 END),0),
                       COALESCE(SUM(CASE WHEN reward_level=2 THEN points_delta ELSE 0 END),0),
                       COALESCE(SUM(CASE WHEN direct_invitee_user_id=0 THEN points_delta ELSE 0 END),0)
                FROM invitation_commission_report_daily
                WHERE user_id=? AND platform_code=? AND report_date>=? AND report_date<?
                """, (rs, row) -> new BigDecimal[]{rs.getBigDecimal(1), rs.getBigDecimal(2), rs.getBigDecimal(3)}, scope);
        List<InvitationCommissionReportResponse.Invitee> rows = jdbc.query("""
                SELECT b.user_id,p.nickname,
                       COALESCE(SUM(CASE WHEN d.reward_level=1 THEN d.points_delta ELSE 0 END),0) direct_points,
                       COALESCE(SUM(CASE WHEN d.reward_level=2 THEN d.points_delta ELSE 0 END),0) indirect_points,
                       COALESCE(SUM(d.points_delta),0) total_points
                FROM (
                    SELECT r.user_id FROM invitation_relation_version r
                    WHERE r.inviter_user_id=? AND r.effective_to IS NULL
                    UNION
                    SELECT d.direct_invitee_user_id FROM invitation_commission_report_daily d
                    WHERE d.user_id=? AND d.platform_code=? AND d.report_date>=? AND d.report_date<?
                ) b
                LEFT JOIN invitation_commission_report_daily d ON d.user_id=? AND d.platform_code=?
                    AND d.direct_invitee_user_id=b.user_id AND d.report_date>=? AND d.report_date<?
                LEFT JOIN user_public_profile p ON p.user_id=b.user_id
                GROUP BY b.user_id,p.nickname
                ORDER BY total_points DESC,b.user_id
                LIMIT ? OFFSET ?
                """, (rs, row) -> new InvitationCommissionReportResponse.Invitee(rs.getLong(1), rs.getString(2),
                        rs.getBigDecimal(3), rs.getBigDecimal(4), rs.getBigDecimal(5)),
                userId, userId, platform, start, end.plusDays(1), userId, platform, start, end.plusDays(1),
                window.size() + 1, window.page() * window.size());
        boolean more = rows.size() > window.size();
        if (more) rows = rows.subList(0, window.size());
        return new InvitationCommissionReportResponse(platform, start, end, totals[0], totals[1],
                totals[0].add(totals[1]), totals[2], window.page(), window.size(), more, rows);
    }

    public InvitationCommissionSourceResponse sources(long userId, String platform, long directInviteeUserId,
                                                       LocalDate start, LocalDate end, int page, int size) {
        Window window = window(start, end, page, size);
        if (directInviteeUserId <= 0) throw new IllegalArgumentException("direct invitee not found");
        Integer allowed = jdbc.queryForObject("""
                SELECT COUNT(*) FROM (
                    SELECT r.user_id FROM invitation_relation_version r
                    WHERE r.user_id=? AND r.inviter_user_id=? AND r.effective_to IS NULL
                    UNION
                    SELECT d.direct_invitee_user_id FROM invitation_commission_report_daily d
                    WHERE d.direct_invitee_user_id=? AND d.user_id=? AND d.platform_code=?
                      AND d.report_date>=? AND d.report_date<?
                ) permitted
                """, Integer.class, directInviteeUserId, userId, directInviteeUserId, userId,
                platform, start, end.plusDays(1));
        if (allowed == null || allowed == 0) throw new IllegalArgumentException("direct invitee not found");
        String nickname = jdbc.query("SELECT nickname FROM user_public_profile WHERE user_id=?",
                (rs, row) -> rs.getString(1), directInviteeUserId).stream().findFirst().orElse(null);
        BigDecimal total = jdbc.queryForObject("""
                SELECT COALESCE(SUM(points_delta),0) FROM invitation_commission_report_daily
                WHERE user_id=? AND platform_code=? AND direct_invitee_user_id=? AND reward_level=2
                  AND report_date>=? AND report_date<?
                """, BigDecimal.class, userId, platform, directInviteeUserId, start, end.plusDays(1));
        List<InvitationCommissionSourceResponse.Source> rows = jdbc.query("""
                SELECT c.user_id,p.nickname,COALESCE(SUM(d.points_delta),0) points
                FROM (
                    SELECT r.user_id FROM invitation_relation_version r
                    WHERE r.inviter_user_id=? AND r.effective_to IS NULL
                    UNION
                    SELECT d.source_user_id FROM invitation_commission_report_daily d
                    WHERE d.user_id=? AND d.platform_code=? AND d.direct_invitee_user_id=?
                      AND d.reward_level=2 AND d.report_date>=? AND d.report_date<?
                ) c
                LEFT JOIN invitation_commission_report_daily d ON d.user_id=? AND d.platform_code=?
                    AND d.direct_invitee_user_id=? AND d.source_user_id=c.user_id AND d.reward_level=2
                    AND d.report_date>=? AND d.report_date<?
                LEFT JOIN user_public_profile p ON p.user_id=c.user_id
                GROUP BY c.user_id,p.nickname
                ORDER BY points DESC,c.user_id
                LIMIT ? OFFSET ?
                """, (rs, row) -> new InvitationCommissionSourceResponse.Source(rs.getLong(1), rs.getString(2),
                        rs.getBigDecimal(3)), directInviteeUserId, userId, platform, directInviteeUserId,
                start, end.plusDays(1), userId, platform, directInviteeUserId, start, end.plusDays(1),
                window.size() + 1, window.page() * window.size());
        boolean more = rows.size() > window.size();
        if (more) rows = rows.subList(0, window.size());
        return new InvitationCommissionSourceResponse(platform, start, end, directInviteeUserId, nickname,
                total == null ? BigDecimal.ZERO : total, window.page(), window.size(), more, rows);
    }

    private Window window(LocalDate start, LocalDate end, int page, int size) {
        if (start == null || end == null || start.isAfter(end) || end.isAfter(LocalDate.now(clock))
                || ChronoUnit.DAYS.between(start, end) >= 60)
            throw new IllegalArgumentException("report period must be within 60 UTC days and not in the future");
        if (page < 0 || page > 10000 || size < 1 || size > 50)
            throw new IllegalArgumentException("invalid report page");
        return new Window(page, size);
    }

    private record Window(int page, int size) { }
}
