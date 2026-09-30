package com.fenxiao.admin.api;

import com.fenxiao.admin.api.dto.SetUserPasswordLoginRequest;
import com.fenxiao.admin.api.dto.UserPasswordLoginStatusResponse;
import com.fenxiao.common.security.DistributionAccessGuard;
import com.fenxiao.distribution.service.UserPasswordLoginService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/distribution/user-password-logins")
public class UserPasswordLoginAdminController {
    private final DistributionAccessGuard access;
    private final UserPasswordLoginService passwords;

    public UserPasswordLoginAdminController(DistributionAccessGuard access, UserPasswordLoginService passwords) {
        this.access = access;
        this.passwords = passwords;
    }

    @PostMapping("/{userId}")
    public UserPasswordLoginStatusResponse setPassword(
            @RequestHeader(value = "X-Admin-Token", required = false) String adminToken,
            @RequestHeader(value = "X-Admin-Session", required = false) String adminSessionToken,
            @PathVariable Long userId,
            @Valid @RequestBody SetUserPasswordLoginRequest request,
            HttpServletRequest servletRequest) {
        var principal = access.assertAdminAccountManageAccess(adminToken, adminSessionToken);
        return new UserPasswordLoginStatusResponse(userId, passwords.setPassword(userId, request.password(),
                principal.accountId(), principal.role(), servletRequest.getRemoteAddr()));
    }

    @DeleteMapping("/{userId}")
    public UserPasswordLoginStatusResponse disable(
            @RequestHeader(value = "X-Admin-Token", required = false) String adminToken,
            @RequestHeader(value = "X-Admin-Session", required = false) String adminSessionToken,
            @PathVariable Long userId,
            HttpServletRequest servletRequest) {
        var principal = access.assertAdminAccountManageAccess(adminToken, adminSessionToken);
        return new UserPasswordLoginStatusResponse(userId, passwords.disable(userId,
                principal.accountId(), principal.role(), servletRequest.getRemoteAddr()));
    }
}
