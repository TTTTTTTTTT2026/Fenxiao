package com.fenxiao.admin.service;

import com.fenxiao.admin.api.dto.CreateSeedInviterRequest;
import com.fenxiao.admin.api.dto.SeedInviterListItem;
import com.fenxiao.admin.api.dto.SeedInviterListResponse;
import com.fenxiao.admin.api.dto.SeedInviterResponse;
import com.fenxiao.audit.entity.OperationAuditLog;
import com.fenxiao.audit.repository.OperationAuditLogRepository;
import com.fenxiao.distribution.repository.DistributionRelationRepository;
import com.fenxiao.distribution.service.DistributionBindingService;
import com.fenxiao.user.entity.UserDistributionProfile;
import com.fenxiao.user.repository.UserDistributionProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Locale;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class SeedInviterAdminService {

    private final DistributionBindingService distributionBindingService;
    private final UserDistributionProfileRepository profiles;
    private final DistributionRelationRepository relations;
    private final OperationAuditLogRepository auditLogs;
    private final Clock clock;

    @Autowired
    public SeedInviterAdminService(DistributionBindingService distributionBindingService,
                                   UserDistributionProfileRepository profiles,
                                   DistributionRelationRepository relations,
                                   OperationAuditLogRepository auditLogs) {
        this(distributionBindingService, profiles, relations, auditLogs, Clock.systemUTC());
    }

    SeedInviterAdminService(DistributionBindingService distributionBindingService,
                            UserDistributionProfileRepository profiles,
                            DistributionRelationRepository relations,
                            OperationAuditLogRepository auditLogs,
                            Clock clock) {
        this.distributionBindingService = distributionBindingService;
        this.profiles = profiles;
        this.relations = relations;
        this.auditLogs = auditLogs;
        this.clock = clock;
    }

    @Transactional
    public SeedInviterResponse create(CreateSeedInviterRequest request,
                                      AdminSessionService.AdminPrincipal actor,
                                      String requestIp) {
        String phoneNumber = normalizePhone(request.phoneNumber());
        String countryCode = normalizeCountry(request.countryCode());
        String languageCode = normalizeLanguage(request.languageCode());
        if ("BR".equals(countryCode) && !phoneNumber.startsWith("+55")) {
            throw new IllegalArgumentException("Brazil registration requires a +55 phone number");
        }
        if (profiles.findByPhoneNumber(phoneNumber).isPresent()) {
            throw new IllegalStateException("phone number already has a distribution profile");
        }

        long userId = generatedUserId(phoneNumber);
        UserDistributionProfile profile = distributionBindingService.createProfile(userId, countryCode, languageCode, null);
        profile.bindPhoneNumber(phoneNumber);
        profiles.save(profile);

        auditLogs.save(OperationAuditLog.create(
                actor.accountId(), actor.role(), "SEED_INVITER", "USER_DISTRIBUTION_PROFILE", profile.getUserId(),
                "CREATE_SEED_INVITER", null,
                "country=" + countryCode + ",language=" + languageCode + ",phone=" + maskPhone(phoneNumber),
                requestIp, "seed root inviter created", LocalDateTime.now(clock)));

        return new SeedInviterResponse(profile.getUserId(), profile.getPhoneNumber(), profile.getCountryCode(), profile.getLanguageCode(), profile.getInviteCode());
    }

    @Transactional
    public SeedInviterListResponse list(int page, int size, AdminSessionService.AdminPrincipal actor, String requestIp) {
        validatePage(page, size);
        Page<OperationAuditLog> result = auditLogs.findByModuleNameAndActionNameOrderByOperatedAtDescIdDesc(
                "SEED_INVITER", "CREATE_SEED_INVITER", PageRequest.of(page, size));
        var userIds = result.getContent().stream().map(OperationAuditLog::getTargetId).toList();
        Map<Long, UserDistributionProfile> profilesByUserId = userIds.isEmpty()
                ? Map.of()
                : profiles.findByUserIdIn(userIds).stream()
                .collect(Collectors.toMap(UserDistributionProfile::getUserId, Function.identity()));
        var items = result.getContent().stream()
                .map(log -> toListItem(log, profilesByUserId.get(log.getTargetId())))
                .filter(java.util.Objects::nonNull)
                .toList();
        auditLogs.save(OperationAuditLog.create(
                actor.accountId(), actor.role(), "SEED_INVITER", "SEED_INVITER_LIST", 0L,
                "VIEW_SEED_INVITER_LIST", null, null, requestIp,
                "page=" + page + ",size=" + size, LocalDateTime.now(clock)));
        return new SeedInviterListResponse(items, result.getTotalElements(), page, size);
    }

    private SeedInviterListItem toListItem(OperationAuditLog creationLog, UserDistributionProfile profile) {
        if (profile == null) return null;
        return new SeedInviterListItem(
                profile.getUserId(), profile.getPhoneNumber(), profile.getCountryCode(), profile.getLanguageCode(),
                profile.getInviteCode(), profile.getAccountStatus().name(), profile.getUserStatus().name(),
                profile.isEffectiveUser(), relations.countByLevel1InviterId(profile.getUserId()),
                creationLog.getOperatedAt(), creationLog.getOperatorId(), creationLog.getOperatorRole());
    }

    private void validatePage(int page, int size) {
        if (page < 0) throw new IllegalArgumentException("page must be greater than or equal to 0");
        if (size < 1 || size > 100) throw new IllegalArgumentException("size must be between 1 and 100");
    }

    private long generatedUserId(String phoneNumber) {
        long userId = 9_000_000_000L + Math.abs((long) phoneNumber.hashCode());
        while (profiles.existsById(userId)) userId++;
        return userId;
    }

    private String normalizePhone(String value) {
        String normalized = value == null ? "" : value.replaceAll("[\\s()-]", "").trim();
        if (!normalized.matches("^\\+?[0-9]{6,20}$")) throw new IllegalArgumentException("phone number is invalid");
        return normalized;
    }

    private String normalizeCountry(String value) {
        String normalized = value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
        if (!normalized.matches("^[A-Z]{2,10}$")) throw new IllegalArgumentException("country code is invalid");
        return normalized;
    }

    private String normalizeLanguage(String value) {
        String normalized = value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
        if (!normalized.matches("^[a-z]{2,3}(-[a-z]{2})?$")) throw new IllegalArgumentException("language code is invalid");
        return normalized;
    }

    private String maskPhone(String phoneNumber) {
        if (phoneNumber.length() <= 6) return "[REDACTED]";
        return phoneNumber.substring(0, 3) + "****" + phoneNumber.substring(phoneNumber.length() - 4);
    }
}
