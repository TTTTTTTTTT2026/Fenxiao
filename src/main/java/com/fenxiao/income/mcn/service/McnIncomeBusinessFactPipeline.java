package com.fenxiao.income.mcn.service;

import com.fenxiao.incentive.service.EffectiveUserQualificationService;
import com.fenxiao.incentive.service.UserGradeAdminService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.Locale;
import java.util.Set;

/**
 * Turns accepted MCN evidence into local, reviewable business facts.
 *
 * Accepted FINAL evidence is reconciled to a formal invitation account only after the
 * company-income calculation. Withdrawal and payment remain separate and disabled.
 */
@Service
public class McnIncomeBusinessFactPipeline {
    private final McnIncomeShadowLedgerService ledger;
    private final McnIncomeRewardCandidateService invitations;
    private final InvitationRewardAccountService invitationAccounts;
    private final EffectiveUserQualificationService effectiveUsers;
    private final UserGradeAdminService grades;

    public McnIncomeBusinessFactPipeline(McnIncomeShadowLedgerService ledger,
                                         McnIncomeRewardCandidateService invitations,
                                         InvitationRewardAccountService invitationAccounts,
                                         EffectiveUserQualificationService effectiveUsers,
                                         UserGradeAdminService grades) {
        this.ledger = ledger;
        this.invitations = invitations;
        this.invitationAccounts = invitationAccounts;
        this.effectiveUsers = effectiveUsers;
        this.grades = grades;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void refresh(String platformCode, Set<LocalDate> businessDates) {
        String platform = platform(platformCode);
        businessDates.stream().filter(java.util.Objects::nonNull).sorted(Comparator.naturalOrder()).forEach(date -> {
            ledger.refresh(platform, date);
            invitations.refresh(platform, date);
            invitationAccounts.reconcile(platform, date);
        });
        // Grade refresh may create a Gold team record, but team-profit sharing remains
        // governed by its separate, disabled feature flag.
        effectiveUsers.refreshPlatform(platform);
        grades.refreshAllVerifiedUsers();
    }

    private String platform(String value) {
        String normalized = value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
        if (!"TIMO".equals(normalized) && !"LINKY".equals(normalized)) {
            throw new IllegalArgumentException("unsupported platform");
        }
        return normalized;
    }
}
