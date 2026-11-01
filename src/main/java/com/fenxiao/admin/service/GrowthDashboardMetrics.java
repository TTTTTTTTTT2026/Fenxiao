package com.fenxiao.admin.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Clock;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;

/** Read-only event-time invitation metrics. No award calculation or data mutation. */
@Service
@Transactional(readOnly = true)
public class GrowthDashboardMetrics {
    private final JdbcTemplate jdbc;
    private final Clock clock;

    public GrowthDashboardMetrics(JdbcTemplate jdbc, Clock clock) { this.jdbc = jdbc; this.clock = clock; }

    public Report report(String platformValue, String countryValue, String period) {
        String platform = platformValue == null ? "" : platformValue.toUpperCase(Locale.ROOT);
        String country = countryValue == null ? "ALL" : countryValue.toUpperCase(Locale.ROOT);
        if (!Set.of("TIMO", "LINKY").contains(platform) || !("ALL".equals(country) || country.matches("[A-Z]{2}")))
            throw new IllegalArgumentException("invalid platform or country");
        LocalDateTime now = LocalDateTime.ofInstant(clock.instant(), ZoneOffset.UTC);
        LocalDateTime today = now.toLocalDate().atStartOfDay();
        String selected = period == null ? "today" : period;
        LocalDateTime start = switch (selected) {
            case "today" -> today;
            case "yesterday" -> today.minusDays(1);
            case "3" -> today.minusDays(2);
            case "7" -> today.minusDays(6);
            case "30" -> today.minusDays(29);
            default -> throw new IllegalArgumentException("invalid dashboard period");
        };
        LocalDateTime end = "yesterday".equals(selected) ? today : now;
        if (!end.isAfter(start)) end = start.plusNanos(1);
        String countryFilter = "ALL".equals(country) ? "" : " AND u.country_code=?";
        Object[] args = "ALL".equals(country)
                ? new Object[]{Timestamp.valueOf(start), Timestamp.valueOf(end)}
                : new Object[]{Timestamp.valueOf(start), Timestamp.valueOf(end), country};
        Long participants = jdbc.queryForObject("""
                SELECT COUNT(DISTINCT r.inviter_user_id) FROM user_distribution_profile u
                JOIN invitation_relation_version r ON r.user_id=u.user_id AND r.version_no=1 AND r.source_type='INVITE_CODE'
                WHERE u.registered_at>=? AND u.registered_at<? AND r.inviter_user_id IS NOT NULL
                """ + countryFilter, Long.class, args);
        Long registered = jdbc.queryForObject("SELECT COUNT(*) FROM user_distribution_profile u WHERE u.registered_at>=? AND u.registered_at<?" + countryFilter, Long.class, args);
        String submission = "TIMO".equals(platform)
                ? "EXISTS (SELECT 1 FROM platform_account_binding b WHERE b.user_id=u.user_id AND b.platform_code='TIMO' AND b.submitted_at>=u.registered_at AND b.submitted_at<?)"
                : "EXISTS (SELECT 1 FROM linky_account_binding b WHERE b.user_id=u.user_id AND b.created_at>=u.registered_at AND b.created_at<?)";
        String verified = "EXISTS (SELECT 1 FROM (" + OperationsDashboardService.firstEvents(platform) + ") v WHERE v.user_id=u.user_id AND v.event_at>=u.registered_at AND v.event_at<?)";
        Object[] cohortArgs = "ALL".equals(country)
                ? new Object[]{Timestamp.valueOf(now), Timestamp.valueOf(now), Timestamp.valueOf(start), Timestamp.valueOf(end)}
                : new Object[]{Timestamp.valueOf(now), Timestamp.valueOf(now), Timestamp.valueOf(start), Timestamp.valueOf(end), country};
        long[] cohort = jdbc.queryForObject("SELECT COALESCE(SUM(CASE WHEN " + submission + " THEN 1 ELSE 0 END),0),"
                        + "COALESCE(SUM(CASE WHEN " + verified + " THEN 1 ELSE 0 END),0) FROM user_distribution_profile u"
                        + " WHERE u.registered_at>=? AND u.registered_at<?" + countryFilter,
                (rs, row) -> new long[]{rs.getLong(1), rs.getLong(2)}, cohortArgs);
        List<Rank> ranks = ranks(platform, country, start, end);
        return new Report(start, end, participants == null ? 0 : participants, registered == null ? 0 : registered,
                cohort[0], cohort[1], ranks);
    }

    public List<RankDetail> enrich(List<Rank> ranks, String platform, String country, LocalDateTime start, LocalDateTime end, boolean includePoints) {
        if (ranks.isEmpty()) return List.of();
        String placeholders = String.join(",", java.util.Collections.nCopies(ranks.size(), "?"));
        Object[] ids = ranks.stream().map(Rank::inviterId).toArray();
        Map<Long, RankDetail> details = new HashMap<>();
        jdbc.query("SELECT u.user_id,p.nickname,u.country_code,a.display_name FROM user_distribution_profile u "
                + "LEFT JOIN user_public_profile p ON p.user_id=u.user_id "
                + "LEFT JOIN user_operations_profile op ON op.user_id=u.user_id "
                + "LEFT JOIN admin_account a ON a.id=op.operator_admin_id WHERE u.user_id IN (" + placeholders + ")",
                rs -> { details.put(rs.getLong(1), new RankDetail(rs.getLong(1), rs.getString(2), rs.getString(3), rs.getString(4), 0, 0, 0, 0, null, null)); }, ids);
        LocalDateTime now = LocalDateTime.ofInstant(clock.instant(), ZoneOffset.UTC);
        String submitted = "TIMO".equals(platform)
                ? "EXISTS (SELECT 1 FROM platform_account_binding b WHERE b.user_id=u.user_id AND b.platform_code='TIMO' AND b.submitted_at>=u.registered_at AND b.submitted_at<?)"
                : "EXISTS (SELECT 1 FROM linky_account_binding b WHERE b.user_id=u.user_id AND b.created_at>=u.registered_at AND b.created_at<?)";
        String verified = "EXISTS (SELECT 1 FROM (" + OperationsDashboardService.firstEvents(platform) + ") v WHERE v.user_id=u.user_id AND v.event_at>=u.registered_at AND v.event_at<?)";
        String countryFilter = "ALL".equals(country) ? "" : " AND u.country_code=?";
        List<Object> cohortArgs = new ArrayList<>(List.of(Timestamp.valueOf(now), Timestamp.valueOf(now), Timestamp.valueOf(start), Timestamp.valueOf(end)));
        if (!"ALL".equals(country)) cohortArgs.add(country);
        cohortArgs.addAll(java.util.Arrays.asList(ids));
        Map<Long, long[]> cohorts = new HashMap<>();
        jdbc.query("SELECT r.inviter_user_id,COUNT(*),SUM(CASE WHEN " + submitted + " THEN 1 ELSE 0 END),SUM(CASE WHEN " + verified + " THEN 1 ELSE 0 END) "
                + "FROM user_distribution_profile u JOIN invitation_relation_version r ON r.user_id=u.user_id AND r.version_no=1 AND r.source_type='INVITE_CODE' "
                + "WHERE u.registered_at>=? AND u.registered_at<?" + countryFilter + " AND r.inviter_user_id IN (" + placeholders + ") GROUP BY r.inviter_user_id",
                rs -> { cohorts.put(rs.getLong(1), new long[]{rs.getLong(2), rs.getLong(3), rs.getLong(4)}); }, cohortArgs.toArray());
        Map<Long, BigDecimal> points = new HashMap<>();
        if (includePoints) {
            LocalDate endExclusive = end.toLocalDate().plusDays(end.toLocalTime().equals(java.time.LocalTime.MIDNIGHT) ? 0 : 1);
            List<Object> args = new ArrayList<>(List.of(platform, start.toLocalDate(), endExclusive));
            args.addAll(java.util.Arrays.asList(ids));
            jdbc.query("SELECT user_id,SUM(reward_points) FROM invitation_reward_entry WHERE platform_code=? AND business_date>=? AND business_date<? AND user_id IN (" + placeholders + ") GROUP BY user_id",
                    rs -> { points.put(rs.getLong(1), rs.getBigDecimal(2)); }, args.toArray());
        }
        return ranks.stream().map(rank -> {
            RankDetail d = details.getOrDefault(rank.inviterId(), new RankDetail(rank.inviterId(), null, null, null, 0, 0, 0, 0, null, null));
            long[] cohort = cohorts.getOrDefault(rank.inviterId(), new long[]{0, 0, 0});
            BigDecimal value = includePoints ? points.getOrDefault(rank.inviterId(), BigDecimal.ZERO) : null;
            return new RankDetail(d.inviterId(), d.nickname(), d.country(), d.operator(), rank.newlyVerifiedInvitees(), cohort[0], cohort[1], cohort[2], null, value == null ? null : value.toPlainString());
        }).toList();
    }

    public List<Rank> ranks(String platformValue, String countryValue, LocalDateTime start, LocalDateTime end) {
        String platform = platformValue == null ? "" : platformValue.toUpperCase(Locale.ROOT);
        String country = countryValue == null ? "ALL" : countryValue.toUpperCase(Locale.ROOT);
        if (!Set.of("TIMO", "LINKY").contains(platform) || !("ALL".equals(country) || country.matches("[A-Z]{2}"))
                || start == null || end == null || !start.isBefore(end) || start.plusDays(61).isBefore(end))
            throw new IllegalArgumentException("invalid dashboard range");
        String events = OperationsDashboardService.firstEvents(platform);
        String countryFilter = "ALL".equals(country) ? "" : " AND u.country_code=?";
        String sql = """
                SELECT r.inviter_user_id, COUNT(*) AS qualified
                FROM (%s) v
                JOIN user_distribution_profile u ON u.user_id=v.user_id
                JOIN invitation_relation_version r ON r.user_id=u.user_id AND r.version_no=1 AND r.source_type='INVITE_CODE'
                WHERE v.event_at>=? AND v.event_at<? AND u.registered_at<=v.event_at AND r.inviter_user_id IS NOT NULL %s
                GROUP BY r.inviter_user_id ORDER BY qualified DESC,r.inviter_user_id ASC LIMIT 10
                """.formatted(events, countryFilter);
        Object[] args = "ALL".equals(country)
                ? new Object[]{Timestamp.valueOf(start), Timestamp.valueOf(end)}
                : new Object[]{Timestamp.valueOf(start), Timestamp.valueOf(end), country};
        return jdbc.query(sql, (rs, row) -> new Rank(rs.getLong(1), rs.getLong(2)), args);
    }

    /** Net entry amounts by source business day, including still-frozen rewards. */
    public BigDecimal rewardPoints(long userId, String platformValue, LocalDate start, LocalDate endExclusive) {
        String platform = platformValue == null ? "" : platformValue.toUpperCase(Locale.ROOT);
        if (userId <= 0 || !Set.of("TIMO", "LINKY").contains(platform) || start == null || endExclusive == null
                || !start.isBefore(endExclusive) || start.plusDays(61).isBefore(endExclusive))
            throw new IllegalArgumentException("invalid reward period");
        return jdbc.queryForObject("""
                SELECT COALESCE(SUM(reward_points),0) FROM invitation_reward_entry
                WHERE user_id=? AND platform_code=? AND business_date>=? AND business_date<?
                """, BigDecimal.class, userId, platform, start, endExclusive);
    }

    public String totalPoints(String platform, String country, LocalDate start, LocalDate endExclusive) {
        if (!Set.of("TIMO", "LINKY").contains(platform) || !("ALL".equals(country) || country.matches("[A-Z]{2}"))
                || !start.isBefore(endExclusive) || start.plusDays(61).isBefore(endExclusive)) throw new IllegalArgumentException("invalid points range");
        String filter = "ALL".equals(country) ? "" : " AND u.country_code=?";
        Object[] args = "ALL".equals(country) ? new Object[]{platform,start,endExclusive} : new Object[]{platform,start,endExclusive,country};
        BigDecimal total = jdbc.queryForObject("SELECT COALESCE(SUM(e.reward_points),0) FROM invitation_reward_entry e JOIN user_distribution_profile u ON u.user_id=e.user_id WHERE e.platform_code=? AND e.business_date>=? AND e.business_date<?"+filter, BigDecimal.class, args);
        return total.toPlainString();
    }

    public record Rank(long inviterId, long newlyVerifiedInvitees) { }
    public record Report(LocalDateTime start, LocalDateTime end, long participatingInviters, long registered,
                         long submitted, long verified, List<Rank> ranks) { }
    public record RankDetail(long inviterId, String nickname, String country, String operator,
                             long newlyVerifiedInvitees, long registered, long submitted, long cohortVerified,
                             Long firstWithdrawal, String rewardPoints) { }
}
