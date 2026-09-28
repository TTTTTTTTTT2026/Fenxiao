package com.fenxiao.admin.api;

import com.fenxiao.admin.service.AdminPermission;
import com.fenxiao.admin.service.AdminSessionService;
import com.fenxiao.distribution.service.SmsDeliveryControlService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/sms-delivery")
public class SmsDeliveryAdminController {
    private final AdminSessionService sessions;
    private final SmsDeliveryControlService controls;

    public SmsDeliveryAdminController(AdminSessionService sessions, SmsDeliveryControlService controls) {
        this.sessions = sessions;
        this.controls = controls;
    }

    @GetMapping
    public SmsDeliveryControlService.Status status(@RequestHeader("X-Admin-Session") String token) {
        sessions.assertPermission(token, AdminPermission.OTP_AUDIT);
        return controls.status();
    }

    @PostMapping
    public SmsDeliveryControlService.Status update(@RequestHeader("X-Admin-Session") String token,
                                                   @Valid @RequestBody UpdateRequest request,
                                                   HttpServletRequest http) {
        var actor = sessions.assertPermission(token, AdminPermission.OTP_AUDIT);
        return controls.setEnabled(request.enabled(), actor, http.getRemoteAddr());
    }

    public record UpdateRequest(@NotNull Boolean enabled) {}
}
