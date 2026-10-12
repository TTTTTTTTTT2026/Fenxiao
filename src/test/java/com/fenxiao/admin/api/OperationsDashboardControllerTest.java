package com.fenxiao.admin.api;

import com.fenxiao.admin.service.*;
import com.fenxiao.common.api.ForbiddenException;
import com.fenxiao.common.security.DistributionAccessGuard;
import org.junit.jupiter.api.Test;
import java.time.LocalDateTime;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class OperationsDashboardControllerTest {
    @Test void checksSessionAndFullScopesBeforeAnyDataOrCacheRead(){
        for(String[] scope:new String[][]{{"TIMO","*","*"},{"*","g1","*"},{"*","*","ID"},{"*","*","*"}}){
            var guard=mock(DistributionAccessGuard.class);var service=mock(OperationsDashboardService.class);
            var principal=new AdminSessionService.AdminPrincipal(1,"admin","Admin",scope[0].equals("*")&&scope[1].equals("*")&&scope[2].equals("*")?"mentor":"admin",false,1,false,LocalDateTime.now().plusDays(1),scope[0],scope[1],scope[2]);
            when(guard.assertAdminAccess(null,"session")).thenReturn(principal);
            var controller=new OperationsDashboardController(guard,service);
            assertThatThrownBy(()->controller.report("session","TIMO","ALL",7,"today")).isInstanceOf(ForbiddenException.class);
            assertThatThrownBy(()->controller.users("session","TIMO","ALL","today","REGISTERED",null,null,0,20)).isInstanceOf(ForbiddenException.class);
            verifyNoInteractions(service);
        }
    }
    @Test void allowsFullScopeStaffReadButNeverBypassesTheSession(){
        var guard=mock(DistributionAccessGuard.class);var service=mock(OperationsDashboardService.class);
        when(guard.assertAdminAccess(null,"valid")).thenReturn(new AdminSessionService.AdminPrincipal(1,"admin","Admin","super_admin",false,1,false,LocalDateTime.now().plusDays(1),"*","*","*"));
        var controller=new OperationsDashboardController(guard,service);
        controller.report("valid","TIMO","ID",30,"7");verify(service).report("TIMO","ID",30,"7");
        when(guard.assertAdminAccess(null,null)).thenThrow(new ForbiddenException("denied"));
        assertThatThrownBy(()->controller.report(null,"TIMO","ALL",7,"today")).isInstanceOf(ForbiddenException.class);
        verifyNoMoreInteractions(service);
    }
}
