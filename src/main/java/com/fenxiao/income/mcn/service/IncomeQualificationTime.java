package com.fenxiao.income.mcn.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;

/** Source-day qualification only; never changes source occurrence time or rule/rate effective times. */
record IncomeQualificationTime(Instant occurredAt, Instant dayEndExclusive) {
    static IncomeQualificationTime of(String granularity, String timezone, LocalDate date,
                                      Instant occurredAt, Instant periodStart, Instant periodEnd) {
        if (granularity == null || granularity.isBlank() || occurredAt == null) {
            throw new IllegalArgumentException("income time metadata is missing");
        }
        if (!"ACCOUNT_GUILD_DAY".equals(granularity)) return new IncomeQualificationTime(occurredAt, null);
        if (timezone == null || timezone.isBlank() || date == null) {
            throw new IllegalArgumentException("income source natural day is missing");
        }
        ZoneId zone = ZoneId.of(timezone);
        Instant start = date.atStartOfDay(zone).toInstant();
        Instant end = date.plusDays(1).atStartOfDay(zone).toInstant();
        if (!start.equals(periodStart) || !end.equals(periodEnd) || !start.equals(occurredAt)) {
            throw new IllegalArgumentException("daily income interval does not match its source natural day");
        }
        return new IncomeQualificationTime(occurredAt, end);
    }

    boolean bindingEffective(LocalDateTime verifiedAt) {
        if (verifiedAt == null) return false;
        Instant verified = verifiedAt.toInstant(ZoneOffset.UTC);
        return dayEndExclusive == null ? !verified.isAfter(occurredAt) : verified.isBefore(dayEndExclusive);
    }

    boolean includesFirstRelation(LocalDateTime effectiveFrom) {
        if (dayEndExclusive == null || effectiveFrom == null) return false;
        Instant from = effectiveFrom.toInstant(ZoneOffset.UTC);
        return !from.isBefore(occurredAt) && from.isBefore(dayEndExclusive);
    }
}
