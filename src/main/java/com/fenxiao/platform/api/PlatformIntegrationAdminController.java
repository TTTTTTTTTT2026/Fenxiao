package com.fenxiao.platform.api;

import com.fenxiao.common.security.DistributionAccessGuard;
import com.fenxiao.platform.dto.PlatformIntegrationResponse;
import com.fenxiao.platform.service.PlatformIntegrationConfigService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/admin/platform-integrations")
public class PlatformIntegrationAdminController {
    private final DistributionAccessGuard accessGuard;
    private final PlatformIntegrationConfigService service;

    public PlatformIntegrationAdminController(DistributionAccessGuard accessGuard, PlatformIntegrationConfigService service) {
        this.accessGuard = accessGuard;
        this.service = service;
    }

    @GetMapping
    public List<PlatformIntegrationResponse> list(@RequestHeader(value = "X-Admin-Token", required = false) String adminToken,
                                                  @RequestHeader(value = "X-Admin-Session", required = false) String adminSessionToken) {
        accessGuard.assertAdminAccess(adminToken, adminSessionToken);
        return service.list();
    }
}
