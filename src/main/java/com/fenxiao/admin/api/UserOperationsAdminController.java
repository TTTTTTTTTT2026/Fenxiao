package com.fenxiao.admin.api;

import com.fenxiao.admin.service.UserOperationsAdminService;
import com.fenxiao.common.security.DistributionAccessGuard;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/distribution/user-platform-profiles")
public class UserOperationsAdminController {
    private final DistributionAccessGuard accessGuard;
    private final UserOperationsAdminService operations;

    public UserOperationsAdminController(DistributionAccessGuard accessGuard, UserOperationsAdminService operations) {
        this.accessGuard = accessGuard;
        this.operations = operations;
    }

    @GetMapping("/options")
    public UserOperationsAdminService.Options options(@RequestHeader(value = "X-Admin-Session", required = false) String sessionToken) {
        accessGuard.assertAdminAccess(null, sessionToken);
        return operations.options();
    }

    @PostMapping("/{userId}/operator")
    public UserOperationsAdminService.Current changeOperator(@RequestHeader(value = "X-Admin-Session", required = false) String sessionToken,
                                                              @PathVariable Long userId,
                                                              @Valid @RequestBody OperatorChangeRequest request,
                                                              HttpServletRequest http) {
        var actor = accessGuard.assertAdminAccountManageAccess(null, sessionToken);
        return operations.changeOperator(userId, request.operatorAdminId(), request.reason(), actor, http.getRemoteAddr());
    }

    @PostMapping("/{userId}/value")
    public UserOperationsAdminService.Current changeValue(@RequestHeader(value = "X-Admin-Session", required = false) String sessionToken,
                                                           @PathVariable Long userId,
                                                           @Valid @RequestBody ValueChangeRequest request,
                                                           HttpServletRequest http) {
        var actor = accessGuard.assertAdminAccountManageAccess(null, sessionToken);
        return operations.changeValue(userId, request.valueCode(), request.reason(), actor, http.getRemoteAddr());
    }

    public record OperatorChangeRequest(Long operatorAdminId, @NotBlank @Size(max = 255) String reason) {}
    public record ValueChangeRequest(@NotBlank String valueCode, @NotBlank @Size(max = 255) String reason) {}
}
