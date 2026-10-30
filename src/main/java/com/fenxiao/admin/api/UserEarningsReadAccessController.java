package com.fenxiao.admin.api;

import com.fenxiao.common.security.DistributionAccessGuard;
import com.fenxiao.distribution.service.UserEarningsReadAccessService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/distribution/user-platform-profiles/{userId}/earnings-read-access")
public class UserEarningsReadAccessController {
    private final DistributionAccessGuard access;
    private final UserEarningsReadAccessService grants;
    public UserEarningsReadAccessController(DistributionAccessGuard access, UserEarningsReadAccessService grants) {
        this.access = access; this.grants = grants;
    }
    @GetMapping
    public List<UserEarningsReadAccessService.State> get(@PathVariable long userId,
            @RequestHeader(value = "X-Admin-Session", required = false) String session) {
        return grants.get(userId, access.assertAdminAccountManageAccess(null, session));
    }
    @PutMapping("/{platformCode}")
    public List<UserEarningsReadAccessService.State> change(@PathVariable long userId, @PathVariable String platformCode,
            @RequestHeader(value = "X-Admin-Session", required = false) String session,
            @Valid @RequestBody Change request, HttpServletRequest http) {
        return grants.change(userId, platformCode, request.enabled(), request.expectedVersion(), request.reason(),
                access.assertAdminAccountManageAccess(null, session), http.getRemoteAddr());
    }
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> conflict(ResponseStatusException error) {
        return ResponseEntity.status(error.getStatusCode()).body(Map.of("message", error.getReason()));
    }
    public record Change(@NotNull Boolean enabled, @NotNull @Min(0) Long expectedVersion,
                         @NotBlank @Size(max = 255) String reason) {}
}
