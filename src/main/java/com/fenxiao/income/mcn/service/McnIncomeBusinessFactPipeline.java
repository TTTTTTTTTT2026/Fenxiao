package com.fenxiao.income.mcn.service;

import com.fenxiao.incentive.service.EffectiveUserQualificationService;
import com.fenxiao.incentive.service.UserGradeAdminService;
import com.fenxiao.incentive.service.UserPointFactService;
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
 * The sequence is deliberately non-financial: raw evidence -> bound FINAL projection ->
 * company-income invitation calculation -> qualification, points and grades.  It never
 * invokes the legacy reward engine and never creates a wallet, withdrawal, payment or
 * formal reward record.
 */
@Service
public class McnIncomeBusinessFactPipeline {
    private final McnIncomeShadowLedgerService ledger;
    private final McnIncomeRewardCandidateService invitations;
    private final EffectiveUserQualificationService effectiveUsers;
    private final UserPointFactService points;
    private final UserGradeAdminService grades;

    public McnIncomeBusinessFactPipeline(McnIncomeShadowLedgerService ledger,
                                         McnIncomeRewardCandidateService invitations,
                                         EffectiveUserQualificationService effectiveUsers,
                                         UserPointFactService points,
                                         UserGradeAdminService grades) {
        this.ledger = ledger;
        this.invitations = invitations;
        this.effectiveUsers = effectiveUsers;
        this.points = points;
        this.grades = grades;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void refresh(String platformCode, Set<LocalDate> businessDates) {
        String platform = platform(platformCode);
        businessDates.stream().filter(java.util.Objects::nonNull).sorted(Comparator.naturalOrder()).forEach(date -> {
            ledger.refresh(platform, date);
            invitations.refresh(platform, date);
        });
        // These functions only derive local eligibility/points/grade facts from BOUND_FINAL MCN
        // evidence.  Grade refresh may create a Gold team record, but team-profit sharing remains
        // governed by its separate, disabled feature flag.
        effectiveUsers.refreshPlatform(platform);
        points.refresh(platform);
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
