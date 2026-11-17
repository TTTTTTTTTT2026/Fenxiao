package com.fenxiao.platform.service;

import com.fenxiao.platform.domain.PlatformVerificationSource;
import com.fenxiao.platform.domain.PlatformVerificationOutcome;
import com.fenxiao.platform.dto.VerifyPlatformBindingRequest;
import com.fenxiao.platform.entity.PlatformAccountBinding;
import com.fenxiao.platform.entity.PlatformVerificationAttempt;
import com.fenxiao.platform.repository.PlatformVerificationAttemptRepository;
import com.fenxiao.user.repository.UserDistributionProfileRepository;
import com.fenxiao.income.mcn.service.VerificationCampaignService;
import com.fenxiao.platform.repository.PlatformBindingHistoryRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class PlatformBindingVerificationService {
    private final PlatformLifecycleService lifecycleService;
    private final PlatformVerificationModeService mode;
    private final Map<PlatformVerificationSource, PlatformVerificationProvider> providers;
    private final UserDistributionProfileRepository users;
    private final McnTimoGuildScopeResolver mcnTimoGuilds;
    private final PlatformVerificationAttemptRepository attempts;
    private final Clock clock;
    private final VerificationCampaignService campaigns;
    private final PlatformBindingHistoryRepository histories;

    public PlatformBindingVerificationService(PlatformLifecycleService lifecycleService,
                                              PlatformVerificationModeService mode,
                                              List<PlatformVerificationProvider> providers,
                                              UserDistributionProfileRepository users,
                                              McnTimoGuildScopeResolver mcnTimoGuilds,
                                              PlatformVerificationAttemptRepository attempts,
                                              Clock clock, VerificationCampaignService campaigns, PlatformBindingHistoryRepository histories) {
        this.lifecycleService = lifecycleService;
        this.mode = mode;
        this.users = users;
        this.mcnTimoGuilds = mcnTimoGuilds;
        this.attempts = attempts;
        this.clock = clock; this.campaigns = campaigns; this.histories = histories;
        Map<PlatformVerificationSource, PlatformVerificationProvider> mapped = new EnumMap<>(PlatformVerificationSource.class);
        providers.forEach(provider -> mapped.put(provider.source(), provider));
        this.providers = Map.copyOf(mapped);
    }

    public record Preflight(PlatformVerificationResult result, String expectedGuildId, String expectedCountry) {}

    public Preflight verifyBeforeSubmission(Long userId, String platform, String account, LocalDateTime submittedAt) {
        if (mode.source() == PlatformVerificationSource.DISABLED) throw new IllegalStateException("verification disabled");
        var provider = providers.get(mode.source());
        if (provider == null) throw new IllegalStateException("verification provider unavailable");
        String country = users.findById(userId).orElseThrow().getCountryCode();
        String guild = null, expectedCountry = null;
        if (mode.source() == PlatformVerificationSource.MCN && "TIMO".equals(platform)) {
            var scope = mcnTimoGuilds.resolve(platform, country);
            guild = scope.officialGuildId(); expectedCountry = scope.mcnCountry();
        }
        return new Preflight(provider.verify(new PlatformVerificationRequest(userId, platform, account, country,
                guild, expectedCountry, submittedAt)), guild, expectedCountry);
    }

    public PlatformAccountBinding verifySubmittedBinding(Long userId, String platformCode) {
        return verifySubmittedBinding(userId, platformCode, null);
    }

    public PlatformAccountBinding verifySubmittedBinding(Long userId, String platformCode, Long expectedBindingId) {
        if (mode.source() == PlatformVerificationSource.DISABLED) {
            throw new IllegalStateException("platform binding verification is temporarily disabled");
        }
        PlatformAccountBinding binding = lifecycleService.lockBinding(userId, platformCode);
        if (expectedBindingId != null && !expectedBindingId.equals(binding.getId())) {
            throw new IllegalStateException("verification is for a previous binding");
        }
        Preflight check = verifyBeforeSubmission(userId, binding.getPlatformCode(), binding.getPlatformUserId(), binding.getSubmittedAt());
        String expectedGuildId = check.expectedGuildId();
        String expectedCountry = check.expectedCountry();
        PlatformVerificationResult result = check.result();
        attempts.save(PlatformVerificationAttempt.record(binding, expectedGuildId, expectedCountry, result, LocalDateTime.now(clock)));
        return switch (result.outcome()) {
            case FOUND -> {
                boolean first = binding.getVerifiedAt() == null && !histories.existsByUserIdAndPlatformCodeAndToStatus(userId, binding.getPlatformCode(), "VERIFIED");
                PlatformAccountBinding verified = lifecycleService.verify(new VerifyPlatformBindingRequest(
                    binding.getPlatformCode(), binding.getPlatformUserId(), result.globallySeenBeforeSubmission(),
                    true, result.officialGuildId(), result.officialJoinedAt(), result.sourceSystem(), result.sourceReference(),
                    binding.getId()));
                if (first && mode.source() == PlatformVerificationSource.MCN && "TIMO".equals(binding.getPlatformCode())) campaigns.capture(userId, "TIMO");
                yield verified;
            }
            case NOT_FOUND -> lifecycleService.rejectVerification(binding, "NOT_IN_TARGET_GUILD",
                    "platform id is not in the target guild", result.sourceSystem());
            case SOURCE_STALE -> lifecycleService.markVerificationInProgress(binding, result.sourceSystem(),
                    result.errorCode() == null ? "SOURCE_STALE" : result.errorCode());
            case ERROR -> result.retryable()
                    ? lifecycleService.markVerificationInProgress(binding, result.sourceSystem(), result.errorCode())
                    : lifecycleService.rejectVerification(binding, result.errorCode() == null ? "MCN_VERIFICATION_ERROR" : result.errorCode(),
                    "MCN could not form an authoritative verification conclusion", result.sourceSystem());
        };
    }
}
