package com.fenxiao.admin.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/** Bounded, read-only ranking over commission and MCN read projections, never the accounting ledger. */
@Service
@Transactional(readOnly = true)
public class HighValueRankingService {
    private static final int BATCH = 400;
    private static final Set<String> METRICS = Set.of("SELF_COMMISSION", "DIRECT_RAW_DIAMONDS", "NEW_INVITEES");
    private final JdbcTemplate jdbc;
    private final Clock clock;

    public HighValueRankingService(JdbcTemplate jdbc, Clock clock) {
        this.jdbc = jdbc;
        this.clock = clock;
    }

    public Report report(String platformCode, String guildId, String countryCode, String period,
                         String periodValue, Long operatorAdminId, String rankingMetric, int page, int size) {
        String platform = normalizedPlatform(platformCode);
        String country = normalizedCountry(countryCode);
        String guild = guildId == null || guildId.isBlank() || "all".equalsIgnoreCase(guildId) ? null : guildId.trim();
        if (guild != null && (guild.length() > 64 || !guild.matches("[A-Za-z0-9_-]+")))
            throw new IllegalArgumentException("invalid guild id");
        if (operatorAdminId != null && operatorAdminId <= 0) throw new IllegalArgumentException("invalid operator");
        String metric = rankingMetric == null ? "SELF_COMMISSION" : rankingMetric.trim().toUpperCase(Locale.ROOT);
        if (!METRICS.contains(metric)) throw new IllegalArgumentException("invalid ranking metric");
        if (page < 0 || page > 10000 || size < 1 || size > 100) throw new IllegalArgumentException("invalid ranking page");
        Window window = window(period, periodValue);

        Timestamp end = Timestamp.valueOf(window.endExclusive().atStartOfDay());
        List<Candidate> candidates = jdbc.query("""
                SELECT u.user_id,p.nickname,
                       (SELECT oc.new_operator_admin_id FROM user_operations_profile_change oc
                        WHERE oc.user_id=u.user_id AND oc.field_name='OPERATOR' AND oc.changed_at<?
                        ORDER BY oc.changed_at DESC,oc.id DESC LIMIT 1) operator_at_end
                FROM user_distribution_profile u
                LEFT JOIN user_public_profile p ON p.user_id=u.user_id
                WHERE u.country_code=? AND COALESCE((
                    SELECT vc.new_value_code FROM user_operations_profile_change vc
                    WHERE vc.user_id=u.user_id AND vc.field_name='VALUE' AND vc.changed_at<?
                    ORDER BY vc.changed_at DESC,vc.id DESC LIMIT 1
                ),'GENERAL')='HIGH_VALUE'
                ORDER BY u.user_id
                """, (rs, row) -> new Candidate(rs.getLong(1), rs.getString(2), nullableLong(rs.getObject(3))),
                end, country, end);

        Map<Long, Totals> totals = new HashMap<>();
        for (int offset = 0; offset < candidates.size(); offset += BATCH) {
            List<Long> ids = candidates.subList(offset, Math.min(offset + BATCH, candidates.size()))
                    .stream().map(Candidate::userId).toList();
            commission(ids, platform, guild, window, operatorAdminId, totals);
            directIncome(ids, platform, guild, window, operatorAdminId, totals);
            newInvitees(ids, platform, guild, window, operatorAdminId, totals);
        }
        List<Item> ranked = candidates.stream()
                .filter(candidate -> operatorAdminId == null || operatorAdminId.equals(candidate.operatorAtEnd())
                        || totals.getOrDefault(candidate.userId(), new Totals()).hasEvidence)
                .map(candidate -> {
                    Totals value = totals.getOrDefault(candidate.userId(), new Totals());
                    return new Item(candidate.userId(), candidate.nickname(), value.self, value.direct, value.invites);
                }).sorted(comparator(metric)).toList();
        int start = (int) Math.min((long) page * size, ranked.size());
        int finish = Math.min(start + size, ranked.size());
        return new Report(platform, guild, country, window.start(), window.endExclusive(), metric,
                operatorAdminId, ranked.size(), page, size, ranked.subList(start, finish));
    }

    private void commission(List<Long> ids, String platform, String guild, Window window,
                            Long operator, Map<Long, Totals> totals) {
        String sql = """
                SELECT e.user_id,COALESCE(SUM(e.points_delta),0),COUNT(*)
                FROM invitation_commission_report_event e
                WHERE e.platform_code=? AND e.business_date>=? AND e.business_date<?
                  AND e.user_id IN (%s)
                """.formatted(placeholders(ids.size()));
        List<Object> args = scope(platform, window, ids);
        if (guild != null) { sql += " AND e.source_guild_id=?"; args.add(guild); }
        if (operator != null) {
            sql += """
                     AND COALESCE((SELECT oc.new_operator_admin_id FROM user_operations_profile_change oc
                                   WHERE oc.user_id=e.user_id AND oc.field_name='OPERATOR' AND oc.changed_at<=e.occurred_at
                                   ORDER BY oc.changed_at DESC,oc.id DESC LIMIT 1),-1)=?
                    """;
            args.add(operator);
        }
        jdbc.query(sql + " GROUP BY e.user_id", rs -> {
            Totals value = totals.computeIfAbsent(rs.getLong(1), ignored -> new Totals());
            value.self = rs.getBigDecimal(2);
            value.hasEvidence |= rs.getLong(3) > 0;
        }, args.toArray());
    }

    private void directIncome(List<Long> ids, String platform, String guild, Window window,
                              Long operator, Map<Long, Totals> totals) {
        String sql = """
                SELECT r.inviter_user_id,COALESCE(SUM(p.amount),0),COUNT(*)
                FROM mcn_income_shadow_ledger_projection p
                JOIN mcn_income_raw_ledger_event raw ON raw.id=p.raw_ledger_event_id
                JOIN invitation_relation_version r ON r.user_id=p.resolved_user_id
                  AND r.effective_from<=raw.occurred_at
                  AND (r.effective_to IS NULL OR r.effective_to>raw.occurred_at)
                WHERE p.source_system='MCN' AND p.platform_code=? AND p.business_date>=? AND p.business_date<?
                  AND p.shadow_status='BOUND_FINAL' AND p.settlement_status='SETTLED'
                  AND p.event_type IN ('INCOME','ADJUSTMENT') AND p.amount_unit=?
                  AND r.inviter_user_id IN (%s)
                """.formatted(placeholders(ids.size()));
        List<Object> args = new ArrayList<>(scope(platform, window, List.of()));
        args.add(platform + "_DIAMOND");
        args.addAll(ids);
        if (guild != null) { sql += " AND p.guild_id=?"; args.add(guild); }
        if (operator != null) {
            sql += """
                     AND COALESCE((SELECT oc.new_operator_admin_id FROM user_operations_profile_change oc
                                   WHERE oc.user_id=r.inviter_user_id AND oc.field_name='OPERATOR' AND oc.changed_at<=raw.occurred_at
                                   ORDER BY oc.changed_at DESC,oc.id DESC LIMIT 1),-1)=?
                    """;
            args.add(operator);
        }
        jdbc.query(sql + " GROUP BY r.inviter_user_id", rs -> {
            Totals value = totals.computeIfAbsent(rs.getLong(1), ignored -> new Totals());
            value.direct = rs.getBigDecimal(2);
            value.hasEvidence |= rs.getLong(3) > 0;
        }, args.toArray());
    }

    private void newInvitees(List<Long> ids, String platform, String guild, Window window,
                             Long operator, Map<Long, Totals> totals) {
        // Only the first successful verification of a user on this application counts.
        // Guild is taken from the verification evidence, not a mutable current binding.
        String events = "LINKY".equals(platform) ? """
                SELECT a.user_id,a.attempted_at event_at,COALESCE(a.observed_guild_id,a.expected_guild_id) guild_id
                FROM linky_verification_attempt a
                WHERE a.user_id IS NOT NULL AND a.result_status IN ('FOUND','ELIGIBLE')
                  AND a.membership_status='IN_EXPECTED_GUILD'
                  AND a.attempted_at>=? AND a.attempted_at<?
                  AND NOT EXISTS (SELECT 1 FROM linky_verification_attempt earlier
                      WHERE earlier.user_id=a.user_id AND earlier.result_status IN ('FOUND','ELIGIBLE')
                        AND earlier.membership_status='IN_EXPECTED_GUILD'
                        AND (earlier.attempted_at<a.attempted_at OR
                             (earlier.attempted_at=a.attempted_at AND earlier.id<a.id)))
                """ : """
                SELECT h.user_id,h.occurred_at event_at,
                       (SELECT va.official_guild_id FROM platform_verification_attempt va
                        WHERE va.binding_id=h.binding_id AND va.outcome='FOUND' AND va.attempted_at<=h.occurred_at
                        ORDER BY va.attempted_at DESC,va.id DESC LIMIT 1) guild_id
                FROM platform_binding_history h
                WHERE h.platform_code='TIMO' AND h.to_status='VERIFIED'
                  AND h.occurred_at>=? AND h.occurred_at<?
                  AND NOT EXISTS (SELECT 1 FROM platform_binding_history earlier
                      WHERE earlier.platform_code='TIMO' AND earlier.user_id=h.user_id AND earlier.to_status='VERIFIED'
                        AND (earlier.occurred_at<h.occurred_at OR
                             (earlier.occurred_at=h.occurred_at AND earlier.id<h.id)))
                """;
        String sql = """
                SELECT r.inviter_user_id,COUNT(DISTINCT v.user_id)
                FROM (%s) v
                JOIN invitation_relation_version r ON r.user_id=v.user_id
                  AND r.effective_from<=v.event_at AND (r.effective_to IS NULL OR r.effective_to>v.event_at)
                WHERE r.inviter_user_id IN (%s)
                """.formatted(events, placeholders(ids.size()));
        List<Object> args = new ArrayList<>();
        args.add(Timestamp.valueOf(window.start().atStartOfDay()));
        args.add(Timestamp.valueOf(window.endExclusive().atStartOfDay()));
        args.addAll(ids);
        if (guild != null) { sql += " AND v.guild_id=?"; args.add(guild); }
        if (operator != null) {
            sql += """
                     AND COALESCE((SELECT oc.new_operator_admin_id FROM user_operations_profile_change oc
                                   WHERE oc.user_id=r.inviter_user_id AND oc.field_name='OPERATOR' AND oc.changed_at<=v.event_at
                                   ORDER BY oc.changed_at DESC,oc.id DESC LIMIT 1),-1)=?
                    """;
            args.add(operator);
        }
        jdbc.query(sql + " GROUP BY r.inviter_user_id", rs -> {
            Totals value = totals.computeIfAbsent(rs.getLong(1), ignored -> new Totals());
            value.invites = rs.getInt(2);
            value.hasEvidence |= value.invites > 0;
        }, args.toArray());
    }

    private Comparator<Item> comparator(String metric) {
        Comparator<Item> byMetric = switch (metric) {
            case "DIRECT_RAW_DIAMONDS" -> Comparator.comparing(Item::directRawDiamonds);
            case "NEW_INVITEES" -> Comparator.comparingInt(Item::newInvitees);
            default -> Comparator.comparing(Item::selfCommission);
        };
        return byMetric.reversed().thenComparingLong(Item::userId);
    }

    private Window window(String period, String value) {
        if (period == null || value == null) throw new IllegalArgumentException("ranking period is required");
        LocalDate start;
        LocalDate end;
        try {
            switch (period.toLowerCase(Locale.ROOT)) {
                case "day" -> { start = LocalDate.parse(value); end = start.plusDays(1); }
                case "week" -> {
                    if (!value.matches("[0-9]{4}-W[0-9]{2}")) throw new IllegalArgumentException("invalid week");
                    start = LocalDate.parse(value + "-1", DateTimeFormatter.ISO_WEEK_DATE);
                    end = start.plusDays(7);
                }
                case "month" -> { start = YearMonth.parse(value).atDay(1); end = start.plusMonths(1); }
                default -> throw new IllegalArgumentException("invalid ranking period");
            }
        } catch (DateTimeParseException exception) { throw new IllegalArgumentException("invalid ranking period value", exception); }
        if (end.isAfter(LocalDate.now(clock)) || start.isBefore(LocalDate.now(clock).minusYears(3)))
            throw new IllegalArgumentException("ranking period must be completed and within three years");
        return new Window(start, end);
    }

    private String normalizedPlatform(String value) {
        String result = value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
        if (!Set.of("LINKY", "TIMO").contains(result)) throw new IllegalArgumentException("select one application");
        return result;
    }

    private String normalizedCountry(String value) {
        String result = value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
        if (!result.matches("[A-Z]{2}")) throw new IllegalArgumentException("country is required");
        return result;
    }

    private static String placeholders(int count) { return java.util.Collections.nCopies(count, "?").stream().collect(Collectors.joining(",")); }
    private static List<Object> scope(String platform, Window window, List<Long> ids) {
        List<Object> args = new ArrayList<>(3 + ids.size());
        args.add(platform); args.add(window.start()); args.add(window.endExclusive()); args.addAll(ids);
        return args;
    }
    private static Long nullableLong(Object value) { return value == null ? null : ((Number) value).longValue(); }

    private record Window(LocalDate start, LocalDate endExclusive) {}
    private record Candidate(long userId, String nickname, Long operatorAtEnd) {}
    private static final class Totals {
        BigDecimal self = BigDecimal.ZERO;
        BigDecimal direct = BigDecimal.ZERO;
        int invites;
        boolean hasEvidence;
    }
    public record Item(long userId, String nickname, BigDecimal selfCommission,
                       BigDecimal directRawDiamonds, int newInvitees) {}
    public record Report(String platformCode, String guildId, String countryCode, LocalDate periodStart,
                         LocalDate periodEndExclusive, String rankingMetric, Long operatorAdminId,
                         int total, int page, int size,
                         List<Item> items) {}
}
