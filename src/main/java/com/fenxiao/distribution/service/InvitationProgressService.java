package com.fenxiao.distribution.service;

import com.fenxiao.distribution.api.dto.InvitationProgressResponse;
import com.fenxiao.distribution.domain.BindSource;
import com.fenxiao.distribution.entity.DistributionRelation;
import com.fenxiao.distribution.entity.LinkyAccountBinding;
import com.fenxiao.distribution.repository.DistributionRelationRepository;
import com.fenxiao.distribution.repository.LinkyAccountBindingRepository;
import com.fenxiao.distribution.repository.LinkyVerificationAttemptRepository;
import com.fenxiao.distribution.entity.LinkyVerificationAttempt;
import com.fenxiao.platform.entity.PlatformAccountBinding;
import com.fenxiao.platform.repository.PlatformAccountBindingRepository;
import com.fenxiao.user.entity.UserDistributionProfile;
import com.fenxiao.user.repository.UserDistributionProfileRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class InvitationProgressService {
    private final DistributionRelationRepository relations;
    private final UserDistributionProfileRepository profiles;
    private final LinkyAccountBindingRepository linkyBindings;
    private final PlatformAccountBindingRepository platformBindings;
    private final LinkyVerificationAttemptRepository linkyAttempts;

    public InvitationProgressService(DistributionRelationRepository relations, UserDistributionProfileRepository profiles,
                                     LinkyAccountBindingRepository linkyBindings,
                                     PlatformAccountBindingRepository platformBindings,
                                     LinkyVerificationAttemptRepository linkyAttempts) {
        this.relations = relations;
        this.profiles = profiles;
        this.linkyBindings = linkyBindings;
        this.platformBindings = platformBindings;
        this.linkyAttempts = linkyAttempts;
    }

    public InvitationProgressResponse get(Long inviterId, String requestedPlatform, int page, int size) {
        String platform = requestedPlatform == null ? "TIMO" : requestedPlatform.trim().toUpperCase(Locale.ROOT);
        if (!Set.of("TIMO", "LINKY").contains(platform)) throw new IllegalArgumentException("unsupported platform");
        if (page < 0 || size < 1 || size > 50) throw new IllegalArgumentException("invalid pagination");
        Page<DistributionRelation> result = relations.findByLevel1InviterIdAndBindSourceOrderByIdDesc(
                inviterId, BindSource.INVITE_CODE, PageRequest.of(page, size));
        List<Long> ids = result.getContent().stream().map(DistributionRelation::getUserId).toList();
        if (ids.isEmpty()) return new InvitationProgressResponse(platform, List.of(), page, size, result.getTotalElements(), false);
        Map<Long, UserDistributionProfile> users = profiles.findByUserIdIn(ids).stream()
                .collect(Collectors.toMap(UserDistributionProfile::getUserId, Function.identity()));
        Map<Long, PlatformAccountBinding> timo = platform.equals("TIMO")
                ? platformBindings.findByUserIdInAndPlatformCode(ids, "TIMO").stream()
                    .collect(Collectors.toMap(PlatformAccountBinding::getUserId, Function.identity(), (first, ignored) -> first))
                : Map.of();
        Map<Long, LinkyAccountBinding> linky = platform.equals("LINKY")
                ? linkyBindings.findByUserIdIn(ids).stream()
                    .collect(Collectors.toMap(LinkyAccountBinding::getUserId, Function.identity(), (first, later) ->
                            first.getId() > later.getId() ? first : later))
                : Map.of();
        Map<Long, LinkyVerificationAttempt> attempts = platform.equals("LINKY")
                ? linkyAttempts.findLatestForUsers(ids).stream()
                    .collect(Collectors.toMap(LinkyVerificationAttempt::getUserId, Function.identity())) : Map.of();
        boolean canAssist = verified(inviterId, platform);
        List<InvitationProgressResponse.Item> items = ids.stream().map(id -> {
            UserDistributionProfile user = users.get(id);
            String status = platform.equals("TIMO") ? timoStatus(timo.get(id)) : linkyStatus(linky.get(id));
            String account = platform.equals("TIMO")
                    ? timo.containsKey(id) ? timo.get(id).getPlatformUserId() : null
                    : linky.containsKey(id) ? linky.get(id).getLinkyAccount() : null;
            if (platform.equals("LINKY") && linky.get(id) == null && attempts.containsKey(id)) {
                var attempt = attempts.get(id);
                // A failed or timed-out first submission is not a new unbound account.
                status = attempt.isRetryable() ? "VERIFYING" : "REJECTED";
                account = attempt.getLinkyAccount();
            }
            return new InvitationProgressResponse.Item(id, maskPhone(user == null ? null : user.getPhoneNumber()),
                    user == null ? null : user.getRegisteredAt().toString(), status, maskAccount(account),
                    user != null && user.getAccountStatus() == com.fenxiao.identity.domain.AccountStatus.ACTIVE
                            && canAssist && "UNBOUND".equals(status));
        }).toList();
        return new InvitationProgressResponse(platform, items, page, size, result.getTotalElements(), result.hasNext());
    }

    public boolean verified(Long userId, String platform) {
        if ("TIMO".equals(platform)) return platformBindings.findByUserIdAndPlatformCode(userId, "TIMO")
                .map(binding -> "VERIFIED".equals(binding.getBindingStatus().name())).orElse(false);
        return linkyBindings.findByUserIdIn(List.of(userId)).stream()
                .max(java.util.Comparator.comparing(LinkyAccountBinding::getId))
                .map(binding -> "VERIFIED".equals(linkyStatus(binding))).orElse(false);
    }

    public InvitationProgressResponse.Item getItem(Long userId, String platform) {
        var user = profiles.findById(userId).orElseThrow(() -> new IllegalArgumentException("user not found"));
        String status;
        String account = null;
        if ("TIMO".equals(platform)) {
            var binding = platformBindings.findByUserIdAndPlatformCode(userId, platform).orElse(null);
            status = timoStatus(binding);
            if (binding != null) account = binding.getPlatformUserId();
        } else {
            var binding = linkyBindings.findByUserIdIn(List.of(userId)).stream()
                    .max(java.util.Comparator.comparing(LinkyAccountBinding::getId)).orElse(null);
            status = linkyStatus(binding);
            if (binding != null) account = binding.getLinkyAccount();
            else {
                var attempt = linkyAttempts.findLatestForUsers(List.of(userId)).stream().findFirst().orElse(null);
                if (attempt != null) {
                    status = attempt.isRetryable() ? "VERIFYING" : "REJECTED";
                    account = attempt.getLinkyAccount();
                }
            }
        }
        return new InvitationProgressResponse.Item(userId, maskPhone(user.getPhoneNumber()),
                user.getRegisteredAt().toString(), status, maskAccount(account), false);
    }

    static String maskAccount(String account) {
        return account == null ? null : "••••" + account.substring(Math.max(0, account.length() - 4));
    }

    public long countVerified(Long inviterId, String platform) {
        return switch (platform) {
            case "TIMO" -> relations.countVerifiedTimoInvitees(inviterId);
            case "LINKY" -> relations.countVerifiedLinkyInvitees(inviterId);
            default -> throw new IllegalArgumentException("unsupported platform");
        };
    }

    static String maskPhone(String phone) {
        if (phone == null || phone.isBlank()) return null;
        String digits = phone.replaceAll("\\D", "");
        if (digits.length() < 7) return null;
        return "+" + digits.substring(0, Math.min(3, digits.length() - 4)) + "****" + digits.substring(digits.length() - 4);
    }

    static String timoStatus(PlatformAccountBinding binding) {
        return binding == null ? "UNBOUND" : binding.getBindingStatus().name();
    }

    static String linkyStatus(LinkyAccountBinding binding) {
        if (binding == null) return "UNBOUND";
        if ("ELIGIBLE".equals(binding.getRegistrationEligibility()) && "MATCHED_OURS".equals(binding.getGuildCheckStatus())) return "VERIFIED";
        if ("REFRESH_FAILED".equals(binding.getGuildCheckStatus())) return "UNKNOWN";
        if ("PENDING".equals(binding.getGuildCheckStatus())) return "VERIFYING";
        return "REJECTED";
    }
}
