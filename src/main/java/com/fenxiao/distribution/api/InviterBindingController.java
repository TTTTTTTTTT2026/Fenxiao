package com.fenxiao.distribution.api;

import com.fenxiao.common.security.DistributionAccessGuard;
import com.fenxiao.distribution.api.dto.AssistedBindingRequest;
import com.fenxiao.distribution.api.dto.InvitationProgressResponse;
import com.fenxiao.distribution.service.InviterBindingService;
import com.fenxiao.platform.service.PlatformBindingVerificationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
public class InviterBindingController {
    private final DistributionAccessGuard access;
    private final InviterBindingService submissions;
    private final PlatformBindingVerificationService verification;

    public InviterBindingController(DistributionAccessGuard access, InviterBindingService submissions,
                                    PlatformBindingVerificationService verification) {
        this.access = access; this.submissions = submissions; this.verification = verification;
    }

    @PostMapping("/api/distribution/team/{inviterId}/invitees/{inviteeId}/bindings")
    public InvitationProgressResponse.Item submit(@RequestHeader("X-Distribution-Token") String token,
            @PathVariable Long inviterId, @PathVariable Long inviteeId,
            @Valid @RequestBody AssistedBindingRequest request, HttpServletRequest http) {
        access.assertUserAccess(inviterId, token);
        Long bindingId;
        try {
            bindingId = submissions.submit(inviterId, inviteeId, request, http.getRemoteAddr());
        } catch (InviterBindingService.LinkySubmissionFailed exception) {
            submissions.recordFailedLinkySubmission(inviterId, inviteeId, request, http.getRemoteAddr());
            var item = submissions.result(inviterId, inviteeId, "LINKY");
            if (!"UNBOUND".equals(item.bindingStatus())) return item;
            throw new IllegalStateException(exception.getMessage());
        }
        if (bindingId != null) {
            try {
                verification.verifySubmittedBinding(inviteeId, "TIMO", bindingId);
            } catch (IllegalStateException exception) {
                // Submission has committed, as in the user's own submit-then-verify flow.
                // The original binding remains available for the existing recovery path.
            }
        }
        return submissions.result(inviterId, inviteeId, request.platformCode());
    }
}
