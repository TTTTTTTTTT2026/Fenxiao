package com.fenxiao.demo;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public final class DemoLeaderboardDtos {
    private DemoLeaderboardDtos() { }

    public record Entry(int rank, String personaId, String maskedNickname, String countryCode,
                        String avatarAssetId, String amountUsd, int invitationCount) { }
    public record Board(String period, LocalDate startDate, LocalDate endDate, List<Entry> items) { }
    public record Snapshot(String mode, String currency, LocalDate asOfDate, Instant publishedAt,
                           Instant nextUpdateAt, boolean stale, List<Board> boards) { }
}
