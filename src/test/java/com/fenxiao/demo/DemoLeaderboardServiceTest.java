package com.fenxiao.demo;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;

import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class DemoLeaderboardServiceTest {
    JdbcTemplate jdbc; ObjectMapper json; Clock clock; DemoLeaderboardService service;
    @BeforeEach void setup() {
        var ds = new DriverManagerDataSource("jdbc:h2:mem:demo-" + UUID.randomUUID() + ";MODE=MySQL;DB_CLOSE_DELAY=-1", "sa", "");
        new ResourceDatabasePopulator(new ClassPathResource("db/migration/V80__add_consumer_demo_leaderboard_snapshot.sql")).execute(ds);
        jdbc = new JdbcTemplate(ds); json = new ObjectMapper().findAndRegisterModules();
        clock = mock(Clock.class); when(clock.getZone()).thenReturn(ZoneOffset.UTC);
        at("2026-10-19T00:10:00Z"); service = new DemoLeaderboardService(jdbc, json, clock, true);
    }
    void at(String value) { when(clock.instant()).thenReturn(Instant.parse(value)); }

    @Test void publishesOnceAndPublicReadNeverGenerates() {
        assertThat(service.latest()).isEmpty();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM consumer_demo_leaderboard_snapshot", Integer.class)).isZero();
        service.publishDue(); String original = jdbc.queryForObject("SELECT payload FROM consumer_demo_leaderboard_snapshot", String.class);
        at("2026-10-19T22:00:00Z"); service.publishDue();
        assertThat(jdbc.queryForObject("SELECT payload FROM consumer_demo_leaderboard_snapshot", String.class)).isEqualTo(original);
        var data = service.latest().orElseThrow();
        assertThat(data.mode()).isEqualTo("DEMO"); assertThat(data.currency()).isEqualTo("USD");
        assertThat(data.asOfDate()).isEqualTo("2026-10-18"); assertThat(data.stale()).isFalse();
        assertThat(data.nextUpdateAt()).isEqualTo(Instant.parse("2026-10-20T00:10:00Z"));
        assertThat(data.boards()).hasSize(3);
    }
    @Test void respectsUtcPublicationBoundaryAndReturnsHonestStaleData() {
        at("2026-10-19T00:09:59Z"); service.publishDue();
        assertThat(service.latest().orElseThrow().asOfDate()).isEqualTo("2026-10-17");
        at("2026-10-19T00:10:00Z");
        assertThat(service.latest().orElseThrow().stale()).isTrue();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM consumer_demo_leaderboard_snapshot", Integer.class)).isEqualTo(1);
        service.publishDue();
        assertThat(service.latest().orElseThrow().asOfDate()).isEqualTo("2026-10-18");
        assertThat(service.latest().orElseThrow().stale()).isFalse();
    }
    @Test void dailyBoundsSortingCountriesAndModerateInviteCountsHoldAcrossDates() {
        for (int offset = 0; offset < 90; offset++) {
            var day = LocalDate.of(2026, 8, 1).plusDays(offset);
            var board = service.generate(day, Instant.EPOCH).boards().getFirst();
            assertThat(board.items()).hasSize(10);
            assertThat(board.items().stream().map(DemoLeaderboardDtos.Entry::personaId).distinct()).hasSize(10);
            assertThat(board.items().stream().filter(e -> e.countryCode().equals("ID"))).hasSize(5);
            assertThat(board.items().stream().filter(e -> e.countryCode().equals("BR"))).hasSize(5);
            BigDecimal previous = new BigDecimal("9999");
            for (int index = 0; index < 10; index++) {
                var entry = board.items().get(index); var amount = new BigDecimal(entry.amountUsd());
                assertThat(entry.rank()).isEqualTo(index + 1);
                assertThat(entry.amountUsd()).matches("[0-9]+\\.[0-9]{2}");
                assertThat(amount).isLessThanOrEqualTo(previous); previous = amount;
                assertThat(amount).isBetween(new BigDecimal(index < 6 ? "20" : "10"), new BigDecimal(index < 6 ? "50" : "19.99"));
                assertThat(entry.invitationCount()).isBetween(1, 5);
                assertThat(entry.maskedNickname()).matches(".\\*{3}.");
                assertThat(entry.avatarAssetId()).isIn("nature-001", "cartoon-001", "portrait-001", "food-001");
            }
        }
    }
    @Test void naturalPeriodsSumSamePersonDailyValuesIncludingLeapMonth() {
        for (String value : new String[]{"2026-10-18", "2026-10-19", "2026-11-01", "2024-02-29", "2027-01-01"}) {
            LocalDate end = LocalDate.parse(value);
            for (var board : service.generate(end, Instant.EPOCH).boards()) {
                assertThat(board.endDate()).isEqualTo(end);
                if (board.period().equals("WEEK")) assertThat(board.startDate().getDayOfWeek()).isEqualTo(DayOfWeek.MONDAY);
                if (board.period().equals("MONTH")) assertThat(board.startDate().getDayOfMonth()).isEqualTo(1);
                for (var entry : board.items()) {
                    int persona = Integer.parseInt(entry.personaId().substring(5)); long cents = 0; int invites = 0;
                    for (LocalDate day = board.startDate(); !day.isAfter(end); day = day.plusDays(1)) {
                        cents += service.dailyCents(persona, day); invites += service.dailyInvitations(persona, day);
                    }
                    assertThat(entry.amountUsd()).isEqualTo(BigDecimal.valueOf(cents, 2).toPlainString());
                    assertThat(entry.invitationCount()).isEqualTo(invites);
                }
            }
        }
    }
    @Test void deterministicRestartAndConcurrentPublicationDoNotChangeSnapshot() {
        var a = service.generate(LocalDate.of(2026, 10, 18), Instant.EPOCH);
        var restarted = new DemoLeaderboardService(jdbc, json, clock, true);
        assertThat(restarted.generate(a.asOfDate(), Instant.EPOCH)).isEqualTo(a);
        CompletableFuture.allOf(CompletableFuture.runAsync(service::publishDue), CompletableFuture.runAsync(restarted::publishDue)).join();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM consumer_demo_leaderboard_snapshot", Integer.class)).isEqualTo(1);
    }
    @Test void disabledFeatureDoesNotReadOrWriteAndSnapshotContainsNoPrivateAccountFields() throws Exception {
        var off = new DemoLeaderboardService(jdbc, json, clock, false); off.publishDue();
        assertThat(off.latest()).isEmpty();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM consumer_demo_leaderboard_snapshot", Integer.class)).isZero();
        String payload = json.writeValueAsString(service.generate(LocalDate.of(2026, 10, 18), Instant.EPOCH));
        assertThat(payload).doesNotContain("phone", "accessToken", "userId", "balance", "withdraw", "real");
    }
}
