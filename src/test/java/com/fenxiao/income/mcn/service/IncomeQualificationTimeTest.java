package com.fenxiao.income.mcn.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import java.time.*;
import static org.assertj.core.api.Assertions.*;

class IncomeQualificationTimeTest {
    @ParameterizedTest
    @ValueSource(strings={"Asia/Shanghai","America/Sao_Paulo","UTC","America/New_York"})
    void countsTheEntireBindingDayInSourceTimezoneAndExcludesTheNextDayBoundary(String name) {
        ZoneId zone=ZoneId.of(name); LocalDate date=LocalDate.of(2026,10,12);
        Instant start=date.atStartOfDay(zone).toInstant(),end=date.plusDays(1).atStartOfDay(zone).toInstant();
        var time=IncomeQualificationTime.of("ACCOUNT_GUILD_DAY",name,date,start,start,end);
        assertThat(time.bindingEffective(LocalDateTime.ofInstant(start.plusSeconds(3600),ZoneOffset.UTC))).isTrue();
        assertThat(time.bindingEffective(LocalDateTime.ofInstant(start.minusSeconds(1),ZoneOffset.UTC))).isTrue();
        assertThat(time.bindingEffective(LocalDateTime.ofInstant(end.minusMillis(1),ZoneOffset.UTC))).isTrue();
        assertThat(time.bindingEffective(LocalDateTime.ofInstant(end,ZoneOffset.UTC))).isFalse();
        assertThat(time.bindingEffective(null)).isFalse();
        assertThat(time.includesFirstRelation(LocalDateTime.ofInstant(start.plusSeconds(3600),ZoneOffset.UTC))).isTrue();
        assertThat(time.includesFirstRelation(LocalDateTime.ofInstant(start.minusSeconds(1),ZoneOffset.UTC))).isFalse();
        assertThat(time.includesFirstRelation(LocalDateTime.ofInstant(end,ZoneOffset.UTC))).isFalse();
    }

    @Test void doesNotRelaxAnActualPointInTimeFact() {
        Instant at=Instant.parse("2026-10-12T00:00:00Z");
        var time=IncomeQualificationTime.of("EVENT","UTC",LocalDate.of(2026,10,12),at,at,at.plusSeconds(1));
        assertThat(time.bindingEffective(LocalDateTime.ofInstant(at,ZoneOffset.UTC))).isTrue();
        assertThat(time.bindingEffective(LocalDateTime.ofInstant(at.plusSeconds(1),ZoneOffset.UTC))).isFalse();
        assertThat(time.includesFirstRelation(LocalDateTime.ofInstant(at,ZoneOffset.UTC))).isFalse();
    }

    @Test void validatesSourceDayRatherThanGuessingUtcOrClampingThePeriod() {
        LocalDate date=LocalDate.of(2026,10,12); Instant start=date.atStartOfDay(ZoneId.of("Asia/Shanghai")).toInstant();
        assertThatThrownBy(()->IncomeQualificationTime.of("ACCOUNT_GUILD_DAY","UTC",date,start,start,start.plusSeconds(86400))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(()->IncomeQualificationTime.of("ACCOUNT_GUILD_DAY","Asia/Shanghai",date,start,start,start.plusSeconds(3600))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(()->IncomeQualificationTime.of("ACCOUNT_GUILD_DAY",null,date,start,start,start.plusSeconds(86400))).isInstanceOf(IllegalArgumentException.class);
    }

    @Test void usesCalendarDayAcrossDaylightSavingRatherThanFixed24Hours() {
        ZoneId zone=ZoneId.of("America/New_York"); LocalDate date=LocalDate.of(2026,3,8);
        Instant start=date.atStartOfDay(zone).toInstant(),end=date.plusDays(1).atStartOfDay(zone).toInstant();
        assertThat(Duration.between(start,end).toHours()).isEqualTo(23);
        assertThat(IncomeQualificationTime.of("ACCOUNT_GUILD_DAY",zone.getId(),date,start,start,end).bindingEffective(LocalDateTime.ofInstant(end.minusSeconds(1),ZoneOffset.UTC))).isTrue();
    }
}
