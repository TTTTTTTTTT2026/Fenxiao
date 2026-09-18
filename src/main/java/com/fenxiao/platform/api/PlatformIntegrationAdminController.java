package com.fenxiao.platform.api;

import com.fenxiao.common.security.DistributionAccessGuard;
import com.fenxiao.platform.dto.PlatformIntegrationResponse;
import com.fenxiao.platform.dto.PlatformGuildOperatingShareRateRequest;
import com.fenxiao.platform.dto.PlatformGuildCompanyShareRuleApprovalRequest;
import com.fenxiao.platform.dto.PlatformGuildCompanyShareRuleResponse;
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
    public PlatformGuildCompanyShareRuleResponse createOperatingShareRateDraft(
            @RequestHeader(value = "X-Admin-Token", required = false) String adminToken,
            @RequestHeader(value = "X-Admin-Session", required = false) String adminSessionToken,
            @PathVariable String platformCode, @PathVariable String guildId,
            @Valid @RequestBody PlatformGuildOperatingShareRateRequest request) {
        var actor = accessGuard.assertFinanceAccess(adminToken, adminSessionToken);
        actor.requireScope(platformCode, guildId, null);
        return service.createOperatingShareDraft(platformCode, guildId, request.operatingShareRate(), request.effectiveFrom(), actor.accountId());
    }

    @GetMapping("/{platformCode}/guilds/{guildId}/operating-share-rules")
    public List<PlatformGuildCompanyShareRuleResponse> companyShareHistory(
            @RequestHeader(value = "X-Admin-Token", required = false) String adminToken,
            @RequestHeader(value = "X-Admin-Session", required = false) String adminSessionToken,
            @PathVariable String platformCode, @PathVariable String guildId) {
        var actor = accessGuard.assertFinanceAccess(adminToken, adminSessionToken);
        actor.requireScope(platformCode, guildId, null);
        return service.companyShareHistory(platformCode, guildId);
    }

    @PostMapping("/operating-share-rules/{id}/activate")
    public PlatformGuildCompanyShareRuleResponse activateOperatingShareRateDraft(
            @RequestHeader(value = "X-Admin-Token", required = false) String adminToken,
            @RequestHeader(value = "X-Admin-Session", required = false) String adminSessionToken,
            @PathVariable long id, @Valid @RequestBody PlatformGuildCompanyShareRuleApprovalRequest request) {
        return service.activateOperatingShareDraft(id, request.approvalNote(), accessGuard.assertFinanceAccess(adminToken, adminSessionToken).accountId());
    }
}
