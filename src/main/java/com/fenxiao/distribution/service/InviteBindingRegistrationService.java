package com.fenxiao.distribution.service;

import com.fenxiao.distribution.api.dto.RegisterLinkyAccountRequest;
import com.fenxiao.distribution.entity.DistributionRelation;
import com.fenxiao.distribution.entity.InviteBindingRegistration;
import com.fenxiao.distribution.entity.GuildAccountConfig;
import com.fenxiao.distribution.repository.DistributionRelationRepository;
import com.fenxiao.distribution.repository.InviteBindingRegistrationRepository;
import com.fenxiao.user.entity.UserDistributionProfile;
import com.fenxiao.user.repository.UserDistributionProfileRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
@Transactional
public class InviteBindingRegistrationService {

    private final UserDistributionProfileRepository userDistributionProfileRepository;
    private final InviteBindingRegistrationRepository inviteBindingRegistrationRepository;
    private final DistributionRelationRepository distributionRelationRepository;
    private final UserProductOwnershipService userProductOwnershipService;
    private final LinkyRegistrationEligibilityService linkyRegistrationEligibilityService;
    private final GuildAccountConfigService guildAccountConfigService;

    public InviteBindingRegistrationService(UserDistributionProfileRepository userDistributionProfileRepository,
                                            InviteBindingRegistrationRepository inviteBindingRegistrationRepository,
                                            DistributionRelationRepository distributionRelationRepository,
                                            UserProductOwnershipService userProductOwnershipService,
                                            LinkyRegistrationEligibilityService linkyRegistrationEligibilityService,
                                            GuildAccountConfigService guildAccountConfigService) {
        this.userDistributionProfileRepository = userDistributionProfileRepository;
        this.inviteBindingRegistrationRepository = inviteBindingRegistrationRepository;
        this.distributionRelationRepository = distributionRelationRepository;
        this.userProductOwnershipService = userProductOwnershipService;
        this.linkyRegistrationEligibilityService = linkyRegistrationEligibilityService;
        this.guildAccountConfigService = guildAccountConfigService;
    }

    public InviteBindingRegistration registerForUser(Long userId, RegisterLinkyAccountRequest request) {
        String normalizedProductCode = normalizeProductCode(request.productCode());
        String normalizedLinkyAccount = normalizeLinkyAccount(request.linkyAccount());

        UserDistributionProfile accountHolder = userDistributionProfileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("user profile not found"));
        String normalizedWhatsappNumber = normalizeWhatsappNumber(accountHolder.getPhoneNumber());
        if (normalizedWhatsappNumber.isBlank()) {
            throw new IllegalStateException("phone number is required before binding a Linky account");
        }
        DistributionRelation relation = distributionRelationRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalStateException("distribution relation not found"));
        UserDistributionProfile attributionProfile = relation.getLevel1InviterId() == null
                ? accountHolder
                : userDistributionProfileRepository.findById(relation.getLevel1InviterId())
                .orElseThrow(() -> new IllegalStateException("inviter profile not found"));

        if (inviteBindingRegistrationRepository.existsByWhatsappNumber(normalizedWhatsappNumber)) {
            throw new IllegalStateException("whatsapp number already registered");
        }
        if (inviteBindingRegistrationRepository.existsByLinkyAccount(normalizedLinkyAccount)) {
            throw new IllegalStateException("linky account already registered");
        }
        GuildAccountConfig expectedGuild = guildAccountConfigService.expectedGuild(normalizedProductCode, attributionProfile.getUserId());
        linkyRegistrationEligibilityService.assertEligibleForExpectedGuild(
                normalizedLinkyAccount,
                expectedGuild.getGuildId(),
                expectedGuild.getGuildName(),
                expectedGuild.getGuildInviteCode()
        );

        InviteBindingRegistration registration = InviteBindingRegistration.createActive(
                normalizedProductCode,
                attributionProfile.getUserId(),
                attributionProfile.getInviteCode(),
                normalizedWhatsappNumber,
                normalizedLinkyAccount
        );
        InviteBindingRegistration saved = inviteBindingRegistrationRepository.save(registration);
        userProductOwnershipService.claimOwnership(
                userId,
                normalizedProductCode,
                "INVITE_BINDING",
                "INVITE_BINDING_REGISTRATION",
                saved.getId()
        );
        linkyRegistrationEligibilityService.attachRegisteredUser(
                normalizedLinkyAccount,
                userId,
                normalizedWhatsappNumber,
                attributionProfile.getInviteCode()
        );
        return saved;
    }

    private String normalizeProductCode(String productCode) {
        return productCode.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeWhatsappNumber(String whatsappNumber) {
        return whatsappNumber == null ? "" : whatsappNumber.replaceAll("[\\s()-]", "").trim();
    }

    private String normalizeLinkyAccount(String linkyAccount) {
        String normalized = linkyAccount.replaceAll("\\s+", "").trim();
        if (!normalized.matches("^[0-9]{8}$")) {
            throw new IllegalArgumentException("linky account must be 8 digits");
        }
        return normalized;
    }
}
