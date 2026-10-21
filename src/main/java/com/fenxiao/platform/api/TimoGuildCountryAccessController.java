package com.fenxiao.platform.api;

import com.fenxiao.common.security.DistributionAccessGuard;
import com.fenxiao.platform.dto.TimoGuildCountryAccessResponse;
import com.fenxiao.platform.dto.UpdateTimoGuildCountriesRequest;
import com.fenxiao.platform.service.TimoGuildCountryAccessService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;

@RestController
@RequestMapping("/admin/platform-integrations/{platform}/guilds/{guildId}/accepted-countries")
public class TimoGuildCountryAccessController {
    private final DistributionAccessGuard guard;
    private final TimoGuildCountryAccessService service;
    public TimoGuildCountryAccessController(DistributionAccessGuard guard, TimoGuildCountryAccessService service) {
        this.guard = guard; this.service = service;
    }
    @GetMapping
    public TimoGuildCountryAccessResponse get(@RequestHeader(value = "X-Admin-Session", required = false) String session,
                                              @PathVariable String platform, @PathVariable String guildId) {
        var actor = guard.assertAdminAccess(null, session);
        actor.requireScope(platform, guildId, null);
        return service.get(platform, guildId);
    }
    @PutMapping
    public TimoGuildCountryAccessResponse save(@RequestHeader(value = "X-Admin-Session", required = false) String session,
                                               @PathVariable String platform, @PathVariable String guildId,
                                               @Valid @RequestBody UpdateTimoGuildCountriesRequest body,
                                               HttpServletRequest request) {
        var actor = guard.assertAdminAccess(null, session);
        return service.save(platform, guildId, body, actor, request.getRemoteAddr());
    }
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> conflict(ResponseStatusException error) {
        return ResponseEntity.status(error.getStatusCode()).body(Map.of("code", "CONFIGURATION_CONFLICT",
                "message", error.getReason() == null ? "配置冲突，请重新读取" : error.getReason()));
    }
}
