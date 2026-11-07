package com.fenxiao.admin.api;

import com.fenxiao.admin.service.AdminPermission;
import com.fenxiao.admin.service.AdminSessionService;
import com.fenxiao.admin.service.UserBindingResetService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/admin/distribution/user-platform-profiles/{userId}/binding-reset/{platform}")
public class UserBindingResetController {
    private final AdminSessionService sessions;
    private final UserBindingResetService resets;

    public UserBindingResetController(AdminSessionService sessions, UserBindingResetService resets) {
        this.sessions = sessions;
        this.resets = resets;
    }

    @GetMapping
    public UserBindingResetService.Preview preview(@PathVariable long userId, @PathVariable String platform,
            @RequestHeader(value = "X-Admin-Session", required = false) String token) {
        return resets.preview(userId, platform, sessions.assertPermission(token, AdminPermission.WRITE));
    }

    @PostMapping
    public ResponseEntity<Void> reset(@PathVariable long userId, @PathVariable String platform,
            @RequestHeader(value = "X-Admin-Session", required = false) String token,
            @Valid @RequestBody Change change, HttpServletRequest request) {
        resets.reset(userId, platform, change.revision(), change.reason(),
                sessions.assertPermission(token, AdminPermission.WRITE), request.getRemoteAddr());
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> error(ResponseStatusException error) {
        return ResponseEntity.status(error.getStatusCode()).body(Map.of("message", error.getReason()));
    }

    public record Change(@NotBlank @Size(max = 64) String revision, @NotBlank @Size(max = 255) String reason) {}
}
