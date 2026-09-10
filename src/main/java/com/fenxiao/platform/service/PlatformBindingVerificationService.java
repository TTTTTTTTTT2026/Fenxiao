package com.fenxiao.platform.service;

import com.fenxiao.platform.domain.PlatformVerificationSource;
import com.fenxiao.platform.dto.VerifyPlatformBindingRequest;
import com.fenxiao.platform.entity.PlatformAccountBinding;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class PlatformBindingVerificationService {
    private final PlatformLifecycleService lifecycleService;
    private final PlatformVerificationModeService mode;
    private final Map<PlatformVerificationSource, PlatformVerificationProvider> providers;

    public PlatformBindingVerificationService(PlatformLifecycleService lifecycleService,
                                              PlatformVerificationModeService mode,
                                              List<PlatformVerificationProvider> providers) {
        this.lifecycleService = lifecycleService;
        this.mode = mode;
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
        PlatformVerificationResult result = provider.verify(binding.getPlatformCode(), binding.getPlatformUserId());
        return lifecycleService.verify(new VerifyPlatformBindingRequest(
                binding.getPlatformCode(), binding.getPlatformUserId(), result.globallySeenBeforeSubmission(),
                result.joinedTargetGuild(), result.officialGuildId(), result.officialJoinedAt(),
                result.sourceSystem(), result.sourceReference()));
    }
}
