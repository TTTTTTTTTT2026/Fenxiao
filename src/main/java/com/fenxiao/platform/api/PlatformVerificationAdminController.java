package com.fenxiao.platform.api;

import com.fenxiao.common.security.DistributionAccessGuard;
import com.fenxiao.platform.dto.PlatformVerificationMockRequest;
import com.fenxiao.platform.dto.PlatformVerificationMockResponse;
import com.fenxiao.platform.dto.PlatformVerificationRuntimeResponse;
import com.fenxiao.platform.service.PlatformVerificationMockAdminService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/platform-verification")
public class PlatformVerificationAdminController {
    private final DistributionAccessGuard access;
    private final PlatformVerificationMockAdminService service;

    public PlatformVerificationAdminController(DistributionAccessGuard access, PlatformVerificationMockAdminService service) {
        this.access = access;
        this.service = service;
    }

    @GetMapping
    public PlatformVerificationRuntimeResponse runtime(@RequestHeader(value = "X-Admin-Token", required = false) String token,
                                                        @RequestHeader(value = "X-Admin-Session", required = false) String session) {
        access.assertAdminAccess(token, session);
        return service.runtime();
    }

    @GetMapping("/mock-records")
    public List<PlatformVerificationMockResponse> listMocks(@RequestHeader(value = "X-Admin-Token", required = false) String token,
                                                              @RequestHeader(value = "X-Admin-Session", required = false) String session) {
        access.assertPlatformMockManageAccess(token, session);
        return service.list();
    }

    @PostMapping("/mock-records")
    public PlatformVerificationMockResponse saveMock(@RequestHeader(value = "X-Admin-Token", required = false) String token,
                                                      @RequestHeader(value = "X-Admin-Session", required = false) String session,
                                                      @Valid @RequestBody PlatformVerificationMockRequest request,
                                                      HttpServletRequest servletRequest) {
        var actor = access.assertPlatformMockManageAccess(token, session);
        return service.save(request, actor, servletRequest.getRemoteAddr());
    }
}
