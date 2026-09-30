package com.fenxiao.admin.api;

import com.fenxiao.admin.service.AdminPermission;
import com.fenxiao.admin.service.AdminSessionService;
import com.fenxiao.distribution.service.SmsDailyWhitelistService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/sms-daily-whitelist")
public class SmsDailyWhitelistAdminController {
    private final AdminSessionService sessions;
    private final SmsDailyWhitelistService whitelist;

    public SmsDailyWhitelistAdminController(AdminSessionService sessions, SmsDailyWhitelistService whitelist) {
        this.sessions = sessions;
        this.whitelist = whitelist;
    }

    @GetMapping
    public SmsDailyWhitelistService.WhitelistPage list(@RequestHeader("X-Admin-Session") String token,
                                                        @RequestParam(defaultValue = "0") int page,
                                                        @RequestParam(defaultValue = "20") int size) {
        sessions.assertPermission(token, AdminPermission.OTP_AUDIT);
        return whitelist.list(page, size);
    }

    @PostMapping
    public SmsDailyWhitelistService.WhitelistItem add(@RequestHeader("X-Admin-Session") String token,
                                                       @Valid @RequestBody AddRequest request,
                                                       HttpServletRequest http) {
        var actor = sessions.assertPermission(token, AdminPermission.OTP_AUDIT);
        return whitelist.add(request.phoneNumber(), actor, http.getRemoteAddr());
    }

    @DeleteMapping("/{id}")
    public void remove(@RequestHeader("X-Admin-Session") String token,
                       @PathVariable long id, HttpServletRequest http) {
        var actor = sessions.assertPermission(token, AdminPermission.OTP_AUDIT);
        whitelist.remove(id, actor, http.getRemoteAddr());
    }

    public record AddRequest(@NotBlank String phoneNumber) {}
}
