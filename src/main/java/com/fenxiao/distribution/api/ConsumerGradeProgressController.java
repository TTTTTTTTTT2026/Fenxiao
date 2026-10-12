package com.fenxiao.distribution.api;

import com.fenxiao.common.security.DistributionAccessGuard;
import com.fenxiao.distribution.api.dto.ConsumerGradeProgressResponse;
import com.fenxiao.distribution.service.ConsumerGradeProgressService;
import com.fenxiao.distribution.service.ConsumerWorkspaceService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/distribution")
public class ConsumerGradeProgressController {
    private final DistributionAccessGuard access;
    private final ConsumerWorkspaceService workspaces;
    private final ConsumerGradeProgressService progress;

    public ConsumerGradeProgressController(DistributionAccessGuard access, ConsumerWorkspaceService workspaces, ConsumerGradeProgressService progress) {
        this.access = access; this.workspaces = workspaces; this.progress = progress;
    }

    @GetMapping("/grade-progress/{userId}")
    public ConsumerGradeProgressResponse get(@RequestHeader("X-Distribution-Token") String token,
                                             @PathVariable long userId, @RequestParam String platformCode) {
        access.assertUserAccess(userId, token);
        return progress.get(userId, workspaces.requireVerified(userId, platformCode));
    }
}
