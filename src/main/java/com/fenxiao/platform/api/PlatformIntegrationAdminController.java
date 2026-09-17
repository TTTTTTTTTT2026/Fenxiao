package com.fenxiao.platform.api;

import com.fenxiao.common.security.DistributionAccessGuard;
import com.fenxiao.platform.dto.PlatformIntegrationResponse;
import com.fenxiao.platform.dto.PlatformGuildOperatingShareRateRequest;
import com.fenxiao.platform.service.PlatformIntegrationConfigService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
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

    @PostMapping("/{platformCode}/guilds/{guildId}/operating-share-rate")
    public PlatformIntegrationResponse.TargetGuild setOperatingShareRate(
            @RequestHeader(value = "X-Admin-Token", required = false) String adminToken,
            @RequestHeader(value = "X-Admin-Session", required = false) String adminSessionToken,
            @PathVariable String platformCode, @PathVariable String guildId,
            @Valid @RequestBody PlatformGuildOperatingShareRateRequest request) {
        accessGuard.assertFinanceAccess(adminToken, adminSessionToken).requireScope(platformCode, guildId, null);
        return service.setOperatingShareRate(platformCode, guildId, request.operatingShareRate());
    }
}
