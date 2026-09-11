package com.fenxiao.platform.mcn;

import java.util.List;

public record McnLinkyBatchResponse(boolean ok, String apiVersion, String requestId, String platform, String lookupMode,
                                    String queriedAt, List<Result> results) {
    public record Result(String platform, String subjectId, String status, String membershipStatus,
                         GuildScope expectedGuildScope, GuildScope observedGuildScope, String sourceScope,
                         String snapshotAt, String sourceGeneration, String checksum, ErrorDetail error) {}
    public record GuildScope(String guildId, String guildName) {}
    public record ErrorDetail(String code, boolean retryable) {}
}
