package com.fenxiao.platform.mcn;

import java.util.List;

public record McnTimoBatchResponse(boolean ok, String requestId, String platform, String queriedAt, List<Result> results) {
    public record Result(String platform, String subjectId, String status, GuildScope guildScope,
                         String sourceScope, String joinedGuildAtBj, String snapshotAt,
                         String sourceGeneration, String checksum, ErrorDetail error) {}
    public record GuildScope(String guildId, String guildExecutorKey, String guildName, String country) {}
    public record ErrorDetail(String code, boolean retryable) {}
}
