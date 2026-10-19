package com.fenxiao.demo;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.Timestamp;
import java.time.*;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import static com.fenxiao.demo.DemoLeaderboardDtos.*;

/** Clearly labelled synthetic examples; deliberately has no access to users, rewards, points or FX. */
@Service
public class DemoLeaderboardService {
    private static final String VERSION = "demo-v1";
    private static final String[] NAMES = {"Ayu", "Maria", "Putri", "Ana", "Rina", "Julia", "Dewi", "Carla", "Indah", "Beatriz"};
    private static final String[] AVATARS = {"nature-001", "cartoon-001", "portrait-001", "food-001"};
    private final JdbcTemplate jdbc;
    private final ObjectMapper json;
    private final Clock clock;
    private final boolean enabled;

    public DemoLeaderboardService(JdbcTemplate jdbc, ObjectMapper json, Clock clock,
                                  @Value("${app.consumer-demo-leaderboard.enabled:true}") boolean enabled) {
        this.jdbc = jdbc; this.json = json; this.clock = clock; this.enabled = enabled;
    }

    public boolean enabled() { return enabled; }

    // Before 00:10 the most recently due publication is yesterday's, covering the day before that.
    LocalDate dueAsOfDate() {
        ZonedDateTime now = clock.instant().atZone(ZoneOffset.UTC);
        return now.toLocalDate().minusDays(now.toLocalTime().isBefore(LocalTime.of(0, 10)) ? 2 : 1);
    }

    public Optional<Snapshot> latest() {
        if (!enabled) return Optional.empty();
        return jdbc.query("SELECT payload FROM consumer_demo_leaderboard_snapshot ORDER BY as_of_date DESC LIMIT 1",
                (rs, row) -> decode(rs.getString(1))).stream().findFirst().map(stored -> new Snapshot(
                stored.mode(), stored.currency(), stored.asOfDate(), stored.publishedAt(), stored.nextUpdateAt(),
                stored.asOfDate().isBefore(dueAsOfDate()), stored.boards()));
    }

    /** Only the scheduled publisher/startup calls this. Public GET requests never generate or write data. */
    public void publishDue() {
        if (!enabled) return;
        LocalDate day = dueAsOfDate();
        if (jdbc.queryForObject("SELECT COUNT(*) FROM consumer_demo_leaderboard_snapshot WHERE as_of_date=?", Integer.class, day) > 0) return;
        Snapshot snapshot = generate(day, clock.instant());
        jdbc.update("""
                INSERT INTO consumer_demo_leaderboard_snapshot(as_of_date,generator_version,published_at,payload)
                VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE as_of_date=VALUES(as_of_date)
                """, day, VERSION, Timestamp.from(snapshot.publishedAt()), encode(snapshot));
    }

    Snapshot generate(LocalDate day, Instant publishedAt) {
        LocalDate weekStart = day.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        return new Snapshot("DEMO", "USD", day, publishedAt,
                day.plusDays(2).atTime(0, 10).toInstant(ZoneOffset.UTC), false,
                List.of(board("DAY", day, day), board("WEEK", weekStart, day), board("MONTH", day.withDayOfMonth(1), day)));
    }

    private Board board(String period, LocalDate start, LocalDate end) {
        List<Entry> entries = new ArrayList<>();
        for (int i = 0; i < NAMES.length; i++) {
            long cents = 0;
            int invitations = 0;
            for (LocalDate day = start; !day.isAfter(end); day = day.plusDays(1)) {
                cents += dailyCents(i, day);
                invitations += dailyInvitations(i, day);
            }
            String name = NAMES[i];
            entries.add(new Entry(0, "demo-" + i, name.substring(0, 1) + "***" + name.substring(name.length() - 1),
                    i % 2 == 0 ? "ID" : "BR", AVATARS[i % AVATARS.length],
                    BigDecimal.valueOf(cents, 2).toPlainString(), invitations));
        }
        // Earnings are the only ranking metric; stable persona ID resolves equal values, not invite counts.
        entries.sort(Comparator.<Entry, BigDecimal>comparing(entry -> new BigDecimal(entry.amountUsd())).reversed()
                .thenComparing(Entry::personaId));
        List<Entry> ranked = new ArrayList<>();
        for (int i = 0; i < entries.size(); i++) {
            Entry value = entries.get(i);
            ranked.add(new Entry(i + 1, value.personaId(), value.maskedNickname(), value.countryCode(),
                    value.avatarAssetId(), value.amountUsd(), value.invitationCount()));
        }
        return new Board(period, start, end, List.copyOf(ranked));
    }

    int dailyCents(int persona, LocalDate day) {
        return persona < 6 ? 2000 + sample(persona, day, "usd", 3001) : 1000 + sample(persona, day, "usd", 1000);
    }

    int dailyInvitations(int persona, LocalDate day) { return 1 + sample(persona, day, "invites", 5); }

    private int sample(int persona, LocalDate day, String field, int bound) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(
                    (VERSION + ":" + persona + ":" + day + ":" + field).getBytes(StandardCharsets.UTF_8));
            long value = ((hash[0] & 255L) << 24) | ((hash[1] & 255L) << 16) | ((hash[2] & 255L) << 8) | (hash[3] & 255L);
            return (int) (value % bound);
        } catch (NoSuchAlgorithmException error) { throw new IllegalStateException(error); }
    }

    private Snapshot decode(String payload) {
        try { return json.readValue(payload, Snapshot.class); }
        catch (JsonProcessingException error) { throw new IllegalStateException("Invalid demo leaderboard snapshot", error); }
    }
    private String encode(Snapshot value) {
        try { return json.writeValueAsString(value); }
        catch (JsonProcessingException error) { throw new IllegalStateException("Could not encode demo leaderboard", error); }
    }
}
