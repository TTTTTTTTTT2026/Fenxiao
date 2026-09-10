package com.fenxiao.platform;

import com.fenxiao.platform.domain.PlatformVerificationOutcome;
import com.fenxiao.platform.mcn.McnTimoBatchResponse;
import com.fenxiao.platform.mcn.McnTimoVerificationClient;
import com.fenxiao.platform.service.McnPlatformVerificationProvider;
import com.fenxiao.platform.service.PlatformVerificationRequest;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class McnPlatformVerificationProviderTest {
    @Test
    void shouldMapAuthoritativeFoundEvidenceWithoutUsingAnUnavailableGlobalSeenFlag() {
        McnTimoVerificationClient client = mock(McnTimoVerificationClient.class);
        when(client.query("923456789012", "22000448", "Brazil")).thenReturn(new McnTimoBatchResponse(true, "request-1", "TIMO", "2026-09-10T10:00:00Z", List.of(
                new McnTimoBatchResponse.Result("TIMO", "923456789012", "found",
                        new McnTimoBatchResponse.GuildScope("22000448", "guild-key", "Royal BR", "Brazil"),
                        "CURRENT_ROSTER", "2026-09-10 12:34:56", "2026-09-10T04:34:56Z", "generation-1", "sha256:proof", null))));

        var result = new McnPlatformVerificationProvider(client).verify(new PlatformVerificationRequest(10001L, "TIMO",
                "923456789012", "BR", "22000448", "Brazil", LocalDateTime.of(2026, 9, 10, 9, 0)));

        assertThat(result.outcome()).isEqualTo(PlatformVerificationOutcome.FOUND);
        assertThat(result.globallySeenBeforeSubmission()).isFalse();
        assertThat(result.officialGuildId()).isEqualTo("22000448");
        assertThat(result.officialJoinedAt()).isEqualTo(LocalDateTime.of(2026, 9, 10, 12, 34, 56));
        assertThat(result.requestId()).isEqualTo("request-1");
        assertThat(result.checksum()).isEqualTo("sha256:proof");
    }

    @Test
    void shouldKeepStaleEvidenceRetryableInsteadOfConvertingItToNotFound() {
        McnTimoVerificationClient client = mock(McnTimoVerificationClient.class);
        when(client.query("923456789012", "22000448", "Brazil")).thenReturn(new McnTimoBatchResponse(true, "request-2", "TIMO", "2026-09-10T10:00:00Z", List.of(
                new McnTimoBatchResponse.Result("TIMO", "923456789012", "source_stale",
                        new McnTimoBatchResponse.GuildScope("22000448", "guild-key", "Royal BR", "Brazil"),
                        "STALE", null, "2026-09-09T04:34:56Z", "generation-1", "sha256:proof",
                        new McnTimoBatchResponse.ErrorDetail("refresh_backoff", true)))));

        var result = new McnPlatformVerificationProvider(client).verify(new PlatformVerificationRequest(10001L, "TIMO",
                "923456789012", "BR", "22000448", "Brazil", LocalDateTime.of(2026, 9, 10, 9, 0)));

        assertThat(result.outcome()).isEqualTo(PlatformVerificationOutcome.SOURCE_STALE);
        assertThat(result.retryable()).isTrue();
        assertThat(result.errorCode()).isEqualTo("refresh_backoff");
    }
}
