package com.fenxiao.distribution.service;

import com.fenxiao.distribution.api.dto.InvitationProgressResponse;
import com.fenxiao.distribution.domain.BindSource;
import com.fenxiao.distribution.entity.DistributionRelation;
import com.fenxiao.distribution.entity.LinkyAccountBinding;
import com.fenxiao.distribution.repository.DistributionRelationRepository;
import com.fenxiao.distribution.repository.LinkyAccountBindingRepository;
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

    public InvitationProgressService(DistributionRelationRepository relations, UserDistributionProfileRepository profiles,
                                     LinkyAccountBindingRepository linkyBindings,
                                     PlatformAccountBindingRepository platformBindings) {
        this.relations = relations;
        this.profiles = profiles;
        this.linkyBindings = linkyBindings;
        this.platformBindings = platformBindings;
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
        List<InvitationProgressResponse.Item> items = ids.stream().map(id -> {
            UserDistributionProfile user = users.get(id);
            String status = platform.equals("TIMO") ? timoStatus(timo.get(id)) : linkyStatus(linky.get(id));
            return new InvitationProgressResponse.Item(id, maskPhone(user == null ? null : user.getPhoneNumber()),
                    user == null ? null : user.getRegisteredAt().toString(), status);
        }).toList();
        return new InvitationProgressResponse(platform, items, page, size, result.getTotalElements(), result.hasNext());
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
