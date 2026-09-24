package com.fenxiao.income.mcn.service;

import com.fenxiao.incentive.service.EffectiveUserQualificationService;
import com.fenxiao.incentive.service.UserGradeAdminService;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;

import java.time.LocalDate;
import java.util.LinkedHashSet;

import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;

class McnIncomeBusinessFactPipelineTest {
    @Test
    void buildsBusinessFactsBeforeRefreshingEligibilityAndGradesWithoutLegacyPoints() {
        McnIncomeShadowLedgerService ledger = mock(McnIncomeShadowLedgerService.class);
        McnIncomeRewardCandidateService invitations = mock(McnIncomeRewardCandidateService.class);
        InvitationRewardAccountService accounts = mock(InvitationRewardAccountService.class);
        EffectiveUserQualificationService effectiveUsers = mock(EffectiveUserQualificationService.class);
        UserGradeAdminService grades = mock(UserGradeAdminService.class);
        McnIncomeBusinessFactPipeline pipeline = new McnIncomeBusinessFactPipeline(ledger, invitations, accounts, effectiveUsers, grades);
        LocalDate first = LocalDate.of(2026, 9, 10);
        LocalDate second = LocalDate.of(2026, 9, 11);

        pipeline.refresh("timo", new LinkedHashSet<>(java.util.List.of(second, first)));

        InOrder order = inOrder(ledger, invitations, accounts, effectiveUsers, grades);
        order.verify(ledger).refresh("TIMO", first);
        order.verify(invitations).refresh("TIMO", first);
        order.verify(accounts).reconcile("TIMO", first);
        order.verify(ledger).refresh("TIMO", second);
        order.verify(invitations).refresh("TIMO", second);
        order.verify(accounts).reconcile("TIMO", second);
        order.verify(effectiveUsers).refreshPlatform("TIMO");
        order.verify(grades).refreshAllVerifiedUsers();
    }
}
