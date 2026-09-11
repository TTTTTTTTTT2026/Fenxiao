package com.fenxiao.distribution.service;

import com.fenxiao.distribution.entity.LinkyAccountBinding;
import com.fenxiao.distribution.repository.LinkyAccountBindingRepository;
import com.fenxiao.platform.mcn.McnLinkyBatchResponse;
import com.fenxiao.platform.mcn.McnLinkyVerificationClient;
import com.fenxiao.platform.mcn.McnLinkyVerificationProperties;
import com.fenxiao.platform.repository.PlatformVerificationMockRepository;
import org.junit.jupiter.api.Test;
import org.springframework.core.env.Environment;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LinkyBindingVerificationServiceTest {
    @Test
    void shouldAcceptOnlyACompleteExactMcnMatch() {
        LinkyAccountBindingRepository bindings = mock(LinkyAccountBindingRepository.class);
        McnLinkyVerificationClient client = mock(McnLinkyVerificationClient.class);
        LinkyVerificationAttemptService attempts = mock(LinkyVerificationAttemptService.class);
        when(bindings.findByLinkyAccount("12345678")).thenReturn(Optional.empty());
        when(bindings.save(any(LinkyAccountBinding.class))).thenAnswer(call -> call.getArgument(0));
        when(client.query("12345678", "39694876")).thenReturn(response("checksum-1"));

        LinkyBindingVerificationService service = service(bindings, client, attempts);
        LinkyAccountBinding binding = service.assertEligibleForExpectedGuild(9L, "12345678", "39694876", "HotSozinha", "JOIN-396", "VERIFIED_BINDING");

        assertThat(binding.getRegistrationEligibility()).isEqualTo("ELIGIBLE");
        assertThat(binding.getGuildId()).isEqualTo("39694876");
        verify(attempts).record(9L, "12345678", "39694876", "MCN", "FOUND", "IN_EXPECTED_GUILD", "39694876",
                "client-request", "2026-09-11T09:00:00Z", "generation-1", "checksum-1", null, false);
    }

    @Test
    void shouldFailClosedWhenMcnOmitsRequiredEvidence() {
        LinkyAccountBindingRepository bindings = mock(LinkyAccountBindingRepository.class);
        McnLinkyVerificationClient client = mock(McnLinkyVerificationClient.class);
        LinkyVerificationAttemptService attempts = mock(LinkyVerificationAttemptService.class);
        when(client.query("12345678", "39694876")).thenReturn(response(""));

        LinkyBindingVerificationService service = service(bindings, client, attempts);

        assertThatThrownBy(() -> service.assertEligibleForExpectedGuild(9L, "12345678", "39694876", "HotSozinha", "JOIN-396", "VERIFIED_BINDING"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("not in the expected guild");
        verify(attempts).record(9L, "12345678", "39694876", "MCN", "REJECTED", "IN_EXPECTED_GUILD", "39694876",
                "client-request", "2026-09-11T09:00:00Z", "generation-1", "", "mcn_evidence_missing", false);
    }

    private LinkyBindingVerificationService service(LinkyAccountBindingRepository bindings,
                                                     McnLinkyVerificationClient client,
                                                     LinkyVerificationAttemptService attempts) {
        Environment environment = mock(Environment.class);
        LinkyVerificationModeService mode = new LinkyVerificationModeService("MCN", environment);
        return new LinkyBindingVerificationService(mode, mock(LinkyRegistrationEligibilityService.class), bindings,
                mock(PlatformVerificationMockRepository.class), new McnLinkyVerificationProperties(), client, attempts);
    }

    private McnLinkyVerificationClient.QueryResponse response(String checksum) {
        McnLinkyBatchResponse.Result result = new McnLinkyBatchResponse.Result("LINKY", "12345678", "found", "IN_EXPECTED_GUILD",
                new McnLinkyBatchResponse.GuildScope("39694876", "HotSozinha"),
                new McnLinkyBatchResponse.GuildScope("39694876", "HotSozinha"), "LIVE_REQUIRED",
                "2026-09-11T09:00:00Z", "generation-1", checksum, null);
        return new McnLinkyVerificationClient.QueryResponse("client-request",
                new McnLinkyBatchResponse(true, "1", "server-request", "LINKY", "LIVE_REQUIRED", "2026-09-11T09:00:00Z", List.of(result)));
    }
}
