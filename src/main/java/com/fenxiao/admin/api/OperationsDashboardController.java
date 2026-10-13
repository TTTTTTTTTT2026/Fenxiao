package com.fenxiao.admin.api;

import com.fenxiao.admin.service.AdminSessionService;
import com.fenxiao.admin.service.OperationsDashboardService;
import com.fenxiao.common.api.ForbiddenException;
import com.fenxiao.common.security.DistributionAccessGuard;
import org.springframework.web.bind.annotation.*;

import java.util.Set;
import java.util.Locale;

@RestController
@RequestMapping("/admin/distribution/operations-dashboard")
public class OperationsDashboardController {
    private final DistributionAccessGuard access;
    private final OperationsDashboardService dashboard;
    public OperationsDashboardController(DistributionAccessGuard access,OperationsDashboardService dashboard){this.access=access;this.dashboard=dashboard;}

    @GetMapping
    public OperationsDashboardService.Report report(@RequestHeader(value="X-Admin-Session",required=false) String session,
           @RequestParam String platformCode,@RequestParam(defaultValue="ALL") String countryCode,
           @RequestParam(defaultValue="7") int trendDays,@RequestParam(defaultValue="today") String period,
           @RequestParam(required=false) String trendPeriod){
        authorize(session);
        return dashboard.report(platformCode,countryCode,trendDays,period,trendPeriod);
    }
    @GetMapping("/users")
    public OperationsDashboardService.Users users(@RequestHeader(value="X-Admin-Session",required=false) String session,
           @RequestParam String platformCode,@RequestParam(defaultValue="ALL") String countryCode,
           @RequestParam(defaultValue="today") String period,@RequestParam String kind,
           @RequestParam(required=false) Long inviterId,@RequestParam(required=false) String date,
           @RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size){
        authorize(session);
        return dashboard.users(platformCode,countryCode,period,kind,inviterId,date,page,size);
    }
    private void authorize(String session) {
        AdminSessionService.AdminPrincipal p=access.assertAdminAccess(null,session);
        // This global acquisition view must not expose unbound users outside a restricted application's/guild's scope.
        if(!Set.of("super_admin","admin","operations","operator","customer_support").contains(p.role().toLowerCase(Locale.ROOT))
                ||!full(p.platformScope())||!full(p.guildScope())||!full(p.regionScope()))throw new ForbiddenException("global operations dashboard requires unrestricted user data scope");
    }
    private static boolean full(String value){return value==null||value.isBlank()||"*".equals(value.trim());}
}
