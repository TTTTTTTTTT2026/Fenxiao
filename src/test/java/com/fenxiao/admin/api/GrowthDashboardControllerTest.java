package com.fenxiao.admin.api;

import com.fenxiao.admin.service.AdminSessionService;
import com.fenxiao.admin.service.GrowthDashboardMetrics;
import com.fenxiao.admin.service.OperationsDashboardService;
import com.fenxiao.common.api.ForbiddenException;
import com.fenxiao.common.security.DistributionAccessGuard;
import org.junit.jupiter.api.Test;
import java.time.LocalDateTime;
import java.util.List;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class GrowthDashboardControllerTest {
    @Test void rejectsRestrictedScopeBeforeReadingData() {
        var access=mock(DistributionAccessGuard.class); var growth=mock(GrowthDashboardMetrics.class);
        var existing=mock(OperationsDashboardService.class);
        when(access.assertAdminAccess(null,"s")).thenReturn(principal("operations","ID"));
        var controller=new GrowthDashboardController(access,growth,existing);
        assertThatThrownBy(() -> controller.report("s","TIMO","ALL","today")).isInstanceOf(ForbiddenException.class);
        verifyNoInteractions(growth,existing);
    }

    @Test void suppressesUnreliableRanksAndNeverReturnsPointsWithoutFinancePermission() {
        var access=mock(DistributionAccessGuard.class); var growth=mock(GrowthDashboardMetrics.class);
        var existing=mock(OperationsDashboardService.class); var old=mock(OperationsDashboardService.Report.class);
        when(access.assertAdminAccess(null,"s")).thenReturn(principal("operations","*"));
        when(access.assertEffectiveUserReadAccess(null,"s")).thenThrow(new ForbiddenException("denied"));
        when(existing.report("TIMO","ALL",7,"today")).thenReturn(old);
        when(old.missingVerificationHistoryUsers()).thenReturn(1L);
        var now=LocalDateTime.parse("2026-10-30T10:00:00");
        when(growth.report("TIMO","ALL","today")).thenReturn(new GrowthDashboardMetrics.Report(now.minusHours(10),now,1,2,1,1,List.of()));
        var response=new GrowthDashboardController(access,growth,existing).report("s","TIMO","ALL","today");
        assertThat(response.ranks()).isEmpty(); assertThat(response.canSeePoints()).isFalse();
        verify(growth,never()).enrich(anyList(),anyString(),anyString(),any(),any(),anyBoolean());
    }
    private AdminSessionService.AdminPrincipal principal(String role,String scope) {
        return new AdminSessionService.AdminPrincipal(1,"admin","Admin",role,false,1,false,LocalDateTime.now().plusDays(1),"*","*",scope);
    }
}
