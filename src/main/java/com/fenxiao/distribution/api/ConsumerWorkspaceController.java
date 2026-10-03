package com.fenxiao.distribution.api;

import com.fenxiao.common.security.DistributionAccessGuard;
import com.fenxiao.distribution.service.ConsumerWorkspaceService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/distribution/workspaces/{userId}")
public class ConsumerWorkspaceController {
    private final DistributionAccessGuard access;
    private final ConsumerWorkspaceService workspaces;

    public ConsumerWorkspaceController(DistributionAccessGuard access, ConsumerWorkspaceService workspaces) {
        this.access = access;
        this.workspaces = workspaces;
    }

    @GetMapping
    public ConsumerWorkspaceService.Workspace get(@RequestHeader("X-Distribution-Token") String token, @PathVariable long userId) {
        access.assertUserAccess(userId, token);
        return workspaces.get(userId);
    }

    @PostMapping
    public ConsumerWorkspaceService.Workspace select(@RequestHeader("X-Distribution-Token") String token,
            @PathVariable long userId, @RequestBody Selection request) {
        access.assertUserAccess(userId, token);
        return workspaces.select(userId, request.platformCode());
    }

    public record Selection(String platformCode) { }
}
