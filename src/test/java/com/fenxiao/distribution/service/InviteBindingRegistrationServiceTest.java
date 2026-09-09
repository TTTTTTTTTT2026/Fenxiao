package com.fenxiao.distribution.service;

import com.fenxiao.distribution.api.dto.RegisterLinkyAccountRequest;
import com.fenxiao.distribution.entity.DistributionRelation;
import com.fenxiao.distribution.entity.InviteBindingRegistration;
import com.fenxiao.distribution.entity.LinkyAccountBinding;
import com.fenxiao.distribution.entity.UserProductOwnership;
import com.fenxiao.distribution.repository.DistributionRelationRepository;
import com.fenxiao.distribution.repository.InviteBindingRegistrationRepository;
import com.fenxiao.distribution.repository.LinkyAccountBindingRepository;
import com.fenxiao.distribution.repository.UserProductOwnershipRepository;
import com.fenxiao.user.entity.UserDistributionProfile;
import com.fenxiao.user.repository.UserDistributionProfileRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@ActiveProfiles("test")
@Transactional
@SpringBootTest
class InviteBindingRegistrationServiceTest {

    @Autowired
    private DistributionBindingService distributionBindingService;

    @Autowired
    private InviteBindingRegistrationService inviteBindingRegistrationService;

    @Autowired
    private InviteBindingRegistrationRepository inviteBindingRegistrationRepository;

    @Autowired
    private DistributionRelationRepository distributionRelationRepository;

    @Autowired
    private UserDistributionProfileRepository userDistributionProfileRepository;

    @Autowired
    private UserProductOwnershipRepository userProductOwnershipRepository;

    @Autowired
    private LinkyRegistrationEligibilityService linkyRegistrationEligibilityService;

    @Autowired
    private LinkyAccountBindingRepository linkyAccountBindingRepository;

    @Test
    void shouldBindLinkyAccountToTheAuthenticatedPhoneProfile() {
        UserDistributionProfile inviter = distributionBindingService.createProfile(51001L, "ID", "id", null);
        UserDistributionProfile accountHolder = distributionBindingService.createProfile(51002L, "ID", "id", inviter.getInviteCode());
        accountHolder.bindPhoneNumber("+6281234567890");
        userDistributionProfileRepository.save(accountHolder);
        linkyRegistrationEligibilityService.markEligible("12345678", "LINKY_DEFAULT_GUILD", "Linky Official Guild", 9001L, "prechecked");

        InviteBindingRegistration registration = inviteBindingRegistrationService.registerForUser(accountHolder.getUserId(), new RegisterLinkyAccountRequest(
                "LINKY",
                "12345678"
        ));

        assertThat(registration.getInviterUserId()).isEqualTo(inviter.getUserId());
        assertThat(registration.getProductCode()).isEqualTo("LINKY");
        assertThat(registration.getInviteCode()).isEqualTo(inviter.getInviteCode());
        assertThat(registration.getWhatsappNumber()).isEqualTo("+6281234567890");
        assertThat(registration.getLinkyAccount()).isEqualTo("12345678");
        assertThat(registration.getBindStatus()).isEqualTo("ACTIVE");
        assertThat(inviteBindingRegistrationRepository.findById(registration.getId())).isPresent();
        assertThat(userDistributionProfileRepository.findById(12345678L)).isEmpty();
        DistributionRelation relation = distributionRelationRepository.findByUserId(accountHolder.getUserId()).orElseThrow();
        assertThat(relation.getLevel1InviterId()).isEqualTo(inviter.getUserId());
        UserProductOwnership ownership = userProductOwnershipRepository.findByUserIdAndProductCode(accountHolder.getUserId(), "LINKY").orElseThrow();
        assertThat(ownership.getOwnershipSource()).isEqualTo("INVITE_BINDING");
        assertThat(ownership.getSourceRecordType()).isEqualTo("INVITE_BINDING_REGISTRATION");
        assertThat(ownership.getSourceRecordId()).isEqualTo(registration.getId());
        LinkyAccountBinding binding = linkyAccountBindingRepository.findByLinkyAccount("12345678").orElseThrow();
        assertThat(binding.getUserId()).isEqualTo(accountHolder.getUserId());
        assertThat(binding.getPhoneNumber()).contains("7890");
        assertThat(binding.getRegistrationEligibility()).isEqualTo("ELIGIBLE");
        assertThat(binding.getExpectedGuildId()).isEqualTo("LINKY_DEFAULT_GUILD");
        assertThat(binding.getExpectedGuildInviteCode()).isEqualTo("JOIN-LINKY");
    }

    @Test
    void shouldRejectDuplicateWhatsappOrLinkyAccount() {
        UserDistributionProfile firstAccount = distributionBindingService.createProfile(51003L, "ID", "id", null);
        firstAccount.bindPhoneNumber("+628123450001");
        userDistributionProfileRepository.save(firstAccount);
        UserDistributionProfile secondAccount = distributionBindingService.createProfile(51004L, "ID", "id", null);
        secondAccount.bindPhoneNumber("+628123451111");
        userDistributionProfileRepository.save(secondAccount);
        linkyRegistrationEligibilityService.markEligible("87654321", "LINKY_DEFAULT_GUILD", "Linky Official Guild", 9001L, "prechecked");
        linkyRegistrationEligibilityService.markEligible("12345678", "LINKY_DEFAULT_GUILD", "Linky Official Guild", 9001L, "prechecked");
        inviteBindingRegistrationService.registerForUser(firstAccount.getUserId(), new RegisterLinkyAccountRequest("LINKY", "87654321"));

        assertThatThrownBy(() -> inviteBindingRegistrationService.registerForUser(firstAccount.getUserId(), new RegisterLinkyAccountRequest(
                "LINKY", "12345678"
        ))).isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("whatsapp number already registered");

        assertThatThrownBy(() -> inviteBindingRegistrationService.registerForUser(secondAccount.getUserId(), new RegisterLinkyAccountRequest(
                "LINKY", "87654321"
        ))).isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("linky account already registered");
    }

    @Test
    void shouldRejectRegistrationWhenLinkyAccountIsNotEligibleForOurGuild() {
        UserDistributionProfile accountHolder = distributionBindingService.createProfile(51005L, "ID", "id", null);
        accountHolder.bindPhoneNumber("+628123459999");
        userDistributionProfileRepository.save(accountHolder);
        linkyRegistrationEligibilityService.markJoinedOtherGuild("23456789", "GUILD-OTHER", "Other Guild", 9001L, "belongs elsewhere");

        assertThatThrownBy(() -> inviteBindingRegistrationService.registerForUser(accountHolder.getUserId(), new RegisterLinkyAccountRequest(
                "LINKY", "23456789"
        ))).isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JOIN-LINKY");
    }
}
