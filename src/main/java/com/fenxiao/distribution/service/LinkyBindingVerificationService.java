package com.fenxiao.distribution.service;

import com.fenxiao.distribution.domain.LinkyVerificationSource;
import com.fenxiao.distribution.entity.LinkyAccountBinding;
import com.fenxiao.distribution.repository.LinkyAccountBindingRepository;
import com.fenxiao.platform.entity.PlatformVerificationMock;
import com.fenxiao.platform.mcn.McnLinkyBatchResponse;
import com.fenxiao.platform.mcn.McnLinkyTransportException;
import com.fenxiao.platform.mcn.McnLinkyVerificationClient;
import com.fenxiao.platform.mcn.McnLinkyVerificationProperties;
import com.fenxiao.platform.repository.PlatformVerificationMockRepository;
import org.springframework.stereotype.Service;

@Service
public class LinkyBindingVerificationService {
    private final LinkyVerificationModeService mode;
    private final LinkyRegistrationEligibilityService legacyEligibility;
    private final LinkyAccountBindingRepository bindings;
    private final PlatformVerificationMockRepository mocks;
    private final McnLinkyVerificationProperties properties;
    private final McnLinkyVerificationClient mcnClient;
    private final LinkyVerificationAttemptService attempts;

    public LinkyBindingVerificationService(LinkyVerificationModeService mode,
                                           LinkyRegistrationEligibilityService legacyEligibility,
                                           LinkyAccountBindingRepository bindings,
                                           PlatformVerificationMockRepository mocks,
                                           McnLinkyVerificationProperties properties,
                                           McnLinkyVerificationClient mcnClient,
                                           LinkyVerificationAttemptService attempts) {
        this.mode = mode;
        this.legacyEligibility = legacyEligibility;
        this.bindings = bindings;
        this.mocks = mocks;
        this.properties = properties;
        this.mcnClient = mcnClient;
        this.attempts = attempts;
    }

    public LinkyAccountBinding assertEligibleForExpectedGuild(Long userId, String linkyAccount, String expectedGuildId,
                                                                String expectedGuildName, String expectedGuildInviteCode,
                                                                String expectedGuildSource) {
        return switch (mode.source()) {
            case LEGACY -> verifyLegacy(userId, linkyAccount, expectedGuildId, expectedGuildName, expectedGuildInviteCode, expectedGuildSource);
            case MOCK -> verifyMock(userId, linkyAccount, expectedGuildId, expectedGuildName, expectedGuildInviteCode, expectedGuildSource);
            case MCN -> verifyMcn(userId, linkyAccount, expectedGuildId, expectedGuildName, expectedGuildInviteCode, expectedGuildSource);
        };
    }

    private LinkyAccountBinding verifyLegacy(Long userId, String linkyAccount, String expectedGuildId, String expectedGuildName,
                                              String expectedGuildInviteCode, String expectedGuildSource) {
        try {
            LinkyAccountBinding binding = legacyEligibility.assertEligibleForExpectedGuild(linkyAccount, expectedGuildId,
                    expectedGuildName, expectedGuildInviteCode, expectedGuildSource);
            attempts.record(userId, linkyAccount, expectedGuildId, "LEGACY", "ELIGIBLE", "IN_EXPECTED_GUILD",
                    binding.getGuildId(), null, null, null, null, null, false);
            return binding;
        } catch (RuntimeException exception) {
            attempts.record(userId, linkyAccount, expectedGuildId, "LEGACY", "REJECTED", null,
                    null, null, null, null, null, safeCode(exception), false);
            throw exception;
        }
    }

    private LinkyAccountBinding verifyMock(Long userId, String linkyAccount, String expectedGuildId, String expectedGuildName,
                                            String expectedGuildInviteCode, String expectedGuildSource) {
        PlatformVerificationMock mock = mocks.findByPlatformCodeAndPlatformUserId("LINKY", linkyAccount)
                .filter(PlatformVerificationMock::isEnabled)
                .orElse(null);
        if (mock == null) {
            attempts.record(userId, linkyAccount, expectedGuildId, "MOCK", "NOT_FOUND", null,
                    null, null, null, null, null, "local_mock_missing", false);
            throw unavailable();
        }
        if (!mock.isJoinedTargetGuild() || !expectedGuildId.equals(mock.getOfficialGuildId())) {
            attempts.record(userId, linkyAccount, expectedGuildId, "MOCK", "NOT_FOUND", "OTHER_GUILD",
                    mock.getOfficialGuildId(), null, null, null, null, "not_in_expected_guild", false);
            throw notInExpectedGuild(expectedGuildName, expectedGuildInviteCode);
        }
        LinkyAccountBinding binding = saveEligible(linkyAccount, expectedGuildId, expectedGuildName, expectedGuildInviteCode,
                expectedGuildSource, "local mock verification passed");
        attempts.record(userId, linkyAccount, expectedGuildId, "MOCK", "FOUND", "IN_EXPECTED_GUILD",
                expectedGuildId, null, mock.getOfficialJoinedAt().toString(), "LOCAL_MOCK",
                mock.getSourceReference(), null, false);
        return binding;
    }

    private LinkyAccountBinding verifyMcn(Long userId, String linkyAccount, String expectedGuildId, String expectedGuildName,
                                           String expectedGuildInviteCode, String expectedGuildSource) {
        if (!expectedGuildId.matches("^[0-9]{8}$") || !properties.isAllowedGuildId(expectedGuildId)) {
            attempts.record(userId, linkyAccount, expectedGuildId, "MCN", "CONFIGURATION_ERROR", null,
                    null, null, null, null, null, "expected_guild_not_mcn_allowlisted", false);
            throw new IllegalStateException("Linky MCN verification cannot be enabled until this invitation route is mapped to an active MCN guild.");
        }
        final McnLinkyVerificationClient.QueryResponse query;
        try {
            query = mcnClient.query(linkyAccount, expectedGuildId);
        } catch (McnLinkyTransportException exception) {
            attempts.record(userId, linkyAccount, expectedGuildId, "MCN", "TRANSPORT_ERROR", null,
                    null, exception.getRequestId(), null, null, null, exception.getErrorCode(), exception.isRetryable());
            throw unavailable();
        } catch (RuntimeException exception) {
            attempts.record(userId, linkyAccount, expectedGuildId, "MCN", "CONFIGURATION_ERROR", null,
                    null, null, null, null, null, safeCode(exception), false);
            throw unavailable();
        }
        McnLinkyBatchResponse.Result result = query.response().results().getFirst();
        String observedGuildId = result.observedGuildScope() == null ? null : result.observedGuildScope().guildId();
        String errorCode = result.error() == null ? null : result.error().code();
        boolean retryable = result.error() != null && result.error().retryable();
        boolean validSubject = "LINKY".equals(result.platform()) && linkyAccount.equals(result.subjectId());
        boolean strictMatch = validSubject
                && "found".equals(result.status())
                && "IN_EXPECTED_GUILD".equals(result.membershipStatus())
                && result.expectedGuildScope() != null
                && expectedGuildId.equals(result.expectedGuildScope().guildId())
                && result.observedGuildScope() != null
                && expectedGuildId.equals(observedGuildId)
                && hasText(result.snapshotAt()) && hasText(result.sourceGeneration()) && hasText(result.checksum());
        if (strictMatch) {
            LinkyAccountBinding binding = saveEligible(linkyAccount, expectedGuildId,
                    hasText(result.observedGuildScope().guildName()) ? result.observedGuildScope().guildName() : expectedGuildName,
                    expectedGuildInviteCode, expectedGuildSource, "MCN Linky v1 verified");
            attempts.record(userId, linkyAccount, expectedGuildId, "MCN", "FOUND", result.membershipStatus(), observedGuildId,
                    query.requestId(), result.snapshotAt(), result.sourceGeneration(), result.checksum(), null, false);
            return binding;
        }
        String outcome = retryable || "UNKNOWN".equals(result.membershipStatus()) ? "SOURCE_STALE" : "REJECTED";
        attempts.record(userId, linkyAccount, expectedGuildId, "MCN", outcome, result.membershipStatus(), observedGuildId,
                query.requestId(), result.snapshotAt(), result.sourceGeneration(), result.checksum(),
                errorCode == null ? invalidResultCode(validSubject, result) : errorCode, retryable || "SOURCE_STALE".equals(outcome));
        if (retryable || "UNKNOWN".equals(result.membershipStatus()) || "error".equals(result.status())) {
            throw unavailable();
        }
        throw notInExpectedGuild(expectedGuildName, expectedGuildInviteCode);
    }

    private LinkyAccountBinding saveEligible(String linkyAccount, String expectedGuildId, String guildName,
                                              String expectedGuildInviteCode, String expectedGuildSource, String remark) {
        LinkyAccountBinding binding = bindings.findByLinkyAccount(linkyAccount)
                .orElseGet(() -> LinkyAccountBinding.createUnchecked(linkyAccount));
        binding.setExpectedGuild(expectedGuildId, guildName, expectedGuildInviteCode, expectedGuildSource);
        binding.markEligible(expectedGuildId, guildName, 0L, remark);
        return bindings.save(binding);
    }

    private IllegalStateException notInExpectedGuild(String guildName, String inviteCode) {
        return new IllegalStateException("Linky account is not in the expected guild " + guildName + ". Please join using invite code " + inviteCode + ".");
    }

    private IllegalStateException unavailable() {
        return new IllegalStateException("Linky verification is temporarily unavailable. Please try again later.");
    }

    private String invalidResultCode(boolean validSubject, McnLinkyBatchResponse.Result result) {
        if (!validSubject) return "mcn_subject_mismatch";
        if (!hasText(result.snapshotAt()) || !hasText(result.sourceGeneration()) || !hasText(result.checksum())) return "mcn_evidence_missing";
        return "mcn_membership_not_accepted";
    }

    private boolean hasText(String value) { return value != null && !value.isBlank(); }

    private String safeCode(RuntimeException exception) {
        return exception.getClass().getSimpleName().toLowerCase(java.util.Locale.ROOT);
    }
}
