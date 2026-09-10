package com.fenxiao.platform.service;

import com.fenxiao.platform.domain.PlatformVerificationSource;
import com.fenxiao.platform.domain.PlatformVerificationOutcome;
import com.fenxiao.platform.dto.VerifyPlatformBindingRequest;
import com.fenxiao.platform.entity.PlatformAccountBinding;
import com.fenxiao.platform.entity.PlatformVerificationAttempt;
import com.fenxiao.platform.repository.PlatformVerificationAttemptRepository;
import com.fenxiao.user.repository.UserDistributionProfileRepository;
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

    public PlatformBindingVerificationService(PlatformLifecycleService lifecycleService,
                                              PlatformVerificationModeService mode,
                                              List<PlatformVerificationProvider> providers,
                                              UserDistributionProfileRepository users,
                                              McnTimoGuildScopeResolver mcnTimoGuilds,
                                              PlatformVerificationAttemptRepository attempts,
                                              Clock clock) {
        this.lifecycleService = lifecycleService;
        this.mode = mode;
        this.users = users;
        this.mcnTimoGuilds = mcnTimoGuilds;
        this.attempts = attempts;
        this.clock = clock;
        Map<PlatformVerificationSource, PlatformVerificationProvider> mapped = new EnumMap<>(PlatformVerificationSource.class);
        providers.forEach(provider -> mapped.put(provider.source(), provider));
        this.providers = Map.copyOf(mapped);
    }

    public PlatformAccountBinding verifySubmittedBinding(Long userId, String platformCode) {
        if (mode.source() == PlatformVerificationSource.DISABLED) {
            throw new IllegalStateException("platform binding verification is temporarily disabled");
        }
        PlatformAccountBinding binding = lifecycleService.getBinding(userId, platformCode);
        PlatformVerificationProvider provider = providers.get(mode.source());
        if (provider == null) throw new IllegalStateException("platform verification provider is unavailable for " + mode.source());
        String expectedGuildId = null;
        String expectedCountry = null;
        String countryCode = users.findById(userId).orElseThrow(() -> new IllegalArgumentException("user not found")).getCountryCode();
        if (mode.source() == PlatformVerificationSource.MCN && "TIMO".equals(binding.getPlatformCode())) {
            McnTimoGuildScopeResolver.ResolvedGuildScope scope = mcnTimoGuilds.resolve(binding.getPlatformCode(), countryCode);
            expectedGuildId = scope.officialGuildId();
            expectedCountry = scope.mcnCountry();
        }
        PlatformVerificationResult result = provider.verify(new PlatformVerificationRequest(userId, binding.getPlatformCode(),
                binding.getPlatformUserId(), countryCode, expectedGuildId, expectedCountry, binding.getSubmittedAt()));
        attempts.save(PlatformVerificationAttempt.record(binding, expectedGuildId, expectedCountry, result, LocalDateTime.now(clock)));
        return switch (result.outcome()) {
            case FOUND -> lifecycleService.verify(new VerifyPlatformBindingRequest(
                    binding.getPlatformCode(), binding.getPlatformUserId(), result.globallySeenBeforeSubmission(),
                    true, result.officialGuildId(), result.officialJoinedAt(), result.sourceSystem(), result.sourceReference()));
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
