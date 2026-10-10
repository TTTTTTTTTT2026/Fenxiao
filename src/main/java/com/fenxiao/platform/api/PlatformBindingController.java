package com.fenxiao.platform.api;

import com.fenxiao.common.security.DistributionAccessGuard;
import com.fenxiao.platform.dto.*;
import com.fenxiao.platform.service.PlatformBindingVerificationService;
import com.fenxiao.platform.service.PlatformLifecycleService;
import com.fenxiao.platform.entity.PlatformAccountBinding;
import com.fenxiao.platform.repository.PlatformVerificationAttemptRepository;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
public class PlatformBindingController {
    private final DistributionAccessGuard accessGuard;
    private final PlatformLifecycleService service;
    private final PlatformBindingVerificationService bindingVerificationService;
    private final PlatformVerificationAttemptRepository verificationAttempts;
    public PlatformBindingController(DistributionAccessGuard accessGuard, PlatformLifecycleService service,
                                     PlatformBindingVerificationService bindingVerificationService,
                                     PlatformVerificationAttemptRepository verificationAttempts) {
        this.accessGuard = accessGuard; this.service = service; this.bindingVerificationService = bindingVerificationService;
        this.verificationAttempts = verificationAttempts;
    }

    private PlatformBindingResponse withVerificationState(PlatformAccountBinding binding) {
        if (binding.getId() == null || !"TIMO".equals(binding.getPlatformCode())) return PlatformBindingResponse.from(binding);
        String latestOutcome = verificationAttempts.findTopByBindingIdOrderByAttemptedAtDesc(binding.getId())
                .map(attempt -> attempt.getOutcome()).orElse(null);
        return PlatformBindingResponse.from(binding, latestOutcome);
    }

    @PostMapping("/api/distribution/platform-bindings/{userId}")
    public PlatformBindingResponse submit(@RequestHeader("X-Distribution-Token") String token,
                                          @PathVariable Long userId,
                                          @Valid @RequestBody SubmitPlatformBindingRequest request) {
        accessGuard.assertUserAccess(userId, token);
        return withVerificationState(service.submit(userId, request.platformCode(), request.platformUserId()));
    }

    @GetMapping("/api/distribution/platform-lifecycle/{userId}/{platformCode}")
    public PlatformLifecycleResponse lifecycle(@RequestHeader("X-Distribution-Token") String token,
                                               @PathVariable Long userId,
                                               @PathVariable String platformCode) {
        accessGuard.assertUserAccess(userId, token);
        return PlatformLifecycleResponse.from(service.get(userId, platformCode));
    }

    @GetMapping("/api/distribution/platform-bindings/{userId}/{platformCode}")
    public PlatformBindingResponse binding(@RequestHeader("X-Distribution-Token") String token,
                                           @PathVariable Long userId, @PathVariable String platformCode) {
        accessGuard.assertUserAccess(userId, token);
        return withVerificationState(service.getBinding(userId, platformCode));
    }

    @PostMapping("/api/distribution/platform-bindings/{userId}/{platformCode}/verify")
    public PlatformBindingResponse verifySubmittedBinding(@RequestHeader("X-Distribution-Token") String token,
                                                           @PathVariable Long userId, @PathVariable String platformCode) {
        accessGuard.assertUserAccess(userId, token);
        return withVerificationState(bindingVerificationService.verifySubmittedBinding(userId, platformCode));
    }

    @PostMapping("/internal/distribution/platform-bindings/verify")
    public PlatformBindingResponse verify(@RequestHeader(value = "X-Internal-Token", required = false) String token,
                                          @Valid @RequestBody VerifyPlatformBindingRequest request) {
        accessGuard.assertInternalToken(token);
        return PlatformBindingResponse.from(service.verify(request));
    }

    @PostMapping("/internal/distribution/platform-facts")
    public PlatformLifecycleResponse ingest(@RequestHeader(value = "X-Internal-Token", required = false) String token,
                                            @Valid @RequestBody PlatformBusinessFactRequest request) {
        accessGuard.assertInternalToken(token);
        return PlatformLifecycleResponse.from(service.ingest(request));
    }

    @PostMapping("/admin/platform/milestone-policies")
    public java.util.Map<String, Object> configurePolicy(
            @RequestHeader(value = "X-Admin-Token", required = false) String adminToken,
            @RequestHeader(value = "X-Admin-Session", required = false) String session,
            @Valid @RequestBody PlatformMilestonePolicyRequest request) {
        accessGuard.assertAdminWriteAccess(adminToken, session);
        var policy = service.configurePolicy(request.platformCode(), request.guildId(), request.countryCode(),
                request.minimumWithdrawableAmount(), request.currencyCode(), request.effectiveFrom());
        return java.util.Map.of("policyId", policy.getId(), "platformCode", policy.getPlatformCode(),
                "guildId", policy.getGuildId(), "countryCode", policy.getCountryCode(),
                "minimumWithdrawableAmount", policy.getMinimumWithdrawableAmount(), "currencyCode", policy.getCurrencyCode());
    }
}
