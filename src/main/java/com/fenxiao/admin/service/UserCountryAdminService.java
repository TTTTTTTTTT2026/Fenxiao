package com.fenxiao.admin.service;

import com.fenxiao.admin.api.dto.UserCountryUpdateResponse;
import com.fenxiao.audit.entity.OperationAuditLog;
import com.fenxiao.audit.repository.OperationAuditLogRepository;
import com.fenxiao.distribution.entity.DistributionRelation;
import com.fenxiao.distribution.repository.DistributionRelationRepository;
import com.fenxiao.user.entity.UserDistributionProfile;
import com.fenxiao.user.repository.UserDistributionProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Set;

@Service
public class UserCountryAdminService {
    private static final Set<String> ISO_COUNTRIES = Set.of(Locale.getISOCountries());

    private final UserDistributionProfileRepository users;
    private final DistributionRelationRepository relations;
    private final OperationAuditLogRepository auditLogs;
    private final Clock clock;

    @Autowired
    public UserCountryAdminService(UserDistributionProfileRepository users,
                                   DistributionRelationRepository relations,
                                   OperationAuditLogRepository auditLogs) {
        this(users, relations, auditLogs, Clock.systemUTC());
    }

    UserCountryAdminService(UserDistributionProfileRepository users,
                            DistributionRelationRepository relations,
                            OperationAuditLogRepository auditLogs,
                            Clock clock) {
        this.users = users;
        this.relations = relations;
        this.auditLogs = auditLogs;
        this.clock = clock;
    }

    @Transactional
    public UserCountryUpdateResponse changeCountry(Long userId, String countryCode,
                                                   Long operatorId, String operatorRole, String requestIp) {
        String normalized = countryCode == null ? "" : countryCode.trim().toUpperCase(Locale.ROOT);
        if (!ISO_COUNTRIES.contains(normalized)) throw new IllegalArgumentException("invalid country code");

        UserDistributionProfile user = users.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("user not found"));
        DistributionRelation relation = relations.findByUserId(userId)
                .orElseThrow(() -> new IllegalStateException("user distribution relation not found"));
        if (normalized.equals(user.getCountryCode()) && normalized.equals(relation.getCountryCode())) {
            return new UserCountryUpdateResponse(userId, normalized);
        }

        String before = snapshot(user, relation);
        boolean crossCountry = false;
        if (relation.getLevel1InviterId() != null) {
            UserDistributionProfile inviter = users.findById(relation.getLevel1InviterId())
                    .orElseThrow(() -> new IllegalStateException("inviter profile not found"));
            crossCountry = !normalized.equalsIgnoreCase(inviter.getCountryCode());
        }
        user.changeCountry(normalized);
        relation.changeCountry(normalized, crossCountry);
        users.save(user);
        relations.save(relation);
        auditLogs.save(OperationAuditLog.create(operatorId, operatorRole, "user", "user_distribution_profile",
                userId, "CHANGE_COUNTRY", before, snapshot(user, relation), requestIp,
                "manual user country adjustment", LocalDateTime.now(clock)));
        return new UserCountryUpdateResponse(userId, normalized);
    }

    private String snapshot(UserDistributionProfile user, DistributionRelation relation) {
        return "countryCode=" + user.getCountryCode() + ",relationCountryCode=" + relation.getCountryCode()
                + ",crossCountry=" + relation.isCrossCountry();
    }
}
