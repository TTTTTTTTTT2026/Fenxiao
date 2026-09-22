package com.fenxiao.income.mcn.service;

import com.fenxiao.incentive.service.EffectiveUserQualificationService;
import com.fenxiao.incentive.service.UserGradeAdminService;
import com.fenxiao.incentive.service.UserPointFactService;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;

import java.time.LocalDate;
import java.util.LinkedHashSet;

import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;

class McnIncomeBusinessFactPipelineTest {
    @Test
    void buildsBusinessFactsBeforeRefreshingEligibilityPointsAndGrades() {
        McnIncomeShadowLedgerService ledger = mock(McnIncomeShadowLedgerService.class);
        McnIncomeRewardCandidateService invitations = mock(McnIncomeRewardCandidateService.class);
        EffectiveUserQualificationService effectiveUsers = mock(EffectiveUserQualificationService.class);
        UserPointFactService points = mock(UserPointFactService.class);
        UserGradeAdminService grades = mock(UserGradeAdminService.class);
        McnIncomeBusinessFactPipeline pipeline = new McnIncomeBusinessFactPipeline(ledger, invitations, effectiveUsers, points, grades);
        LocalDate first = LocalDate.of(2026, 9, 10);
        LocalDate second = LocalDate.of(2026, 9, 11);

        pipeline.refresh("timo", new LinkedHashSet<>(java.util.List.of(second, first)));

        InOrder order = inOrder(ledger, invitations, effectiveUsers, points, grades);
        order.verify(ledger).refresh("TIMO", first);
        order.verify(invitations).refresh("TIMO", first);
        order.verify(ledger).refresh("TIMO", second);
        order.verify(invitations).refresh("TIMO", second);
        order.verify(effectiveUsers).refreshPlatform("TIMO");
        order.verify(points).refresh("TIMO");
        order.verify(grades).refreshAllVerifiedUsers();
    }
}
