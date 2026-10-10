package com.fenxiao.admin.api;

import com.fenxiao.admin.service.UserNicknameAdminService;
import com.fenxiao.common.security.DistributionAccessGuard;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/distribution/user-platform-profiles")
public class UserNicknameAdminController {
    private final DistributionAccessGuard accessGuard;
    private final UserNicknameAdminService nicknames;

    public UserNicknameAdminController(DistributionAccessGuard accessGuard, UserNicknameAdminService nicknames) {
        this.accessGuard = accessGuard;
        this.nicknames = nicknames;
    }

    @PostMapping("/{userId}/nickname")
    public UserNicknameAdminService.NicknameUpdate changeNickname(
            @RequestHeader(value = "X-Admin-Session", required = false) String sessionToken,
            @PathVariable Long userId,
            @Valid @RequestBody NicknameChangeRequest request,
            HttpServletRequest http) {
        var actor = accessGuard.assertAdminWriteAccess(null, sessionToken);
        return nicknames.changeNickname(userId, request.nickname(), actor, http.getRemoteAddr());
    }

    public record NicknameChangeRequest(@Size(max = 40) String nickname) {}
}
