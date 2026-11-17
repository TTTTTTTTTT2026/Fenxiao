package com.fenxiao.distribution.api;

import com.fenxiao.common.security.DistributionAccessGuard;
import com.fenxiao.distribution.api.dto.*;
import com.fenxiao.distribution.service.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/distribution/team/{inviterId}/pre-registrations")
public class PreRegistrationController {
    private final DistributionAccessGuard access;
    private final PreRegistrationService service;
    private final PreRegistrationCoordinator coordinator;
    public PreRegistrationController(DistributionAccessGuard access,PreRegistrationService service,PreRegistrationCoordinator coordinator) {
        this.access=access;this.service=service;this.coordinator=coordinator;
    }
    @GetMapping
    public PreRegistrationResponse list(@PathVariable Long inviterId,@RequestHeader("X-Distribution-Token") String token,
            @RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) {
        access.assertUserAccess(inviterId,token);return service.list(inviterId,page,size);
    }
    @GetMapping("/{id}/edit-input")
    public PreRegistrationRequest editInput(@PathVariable Long inviterId,@PathVariable Long id,@RequestHeader("X-Distribution-Token") String token) {
        access.assertUserAccess(inviterId,token);return service.editInput(inviterId,id);
    }
    @PostMapping
    public PreRegistrationResponse.Item create(@PathVariable Long inviterId,@RequestHeader("X-Distribution-Token") String token,
            @Valid @RequestBody PreRegistrationRequest request,HttpServletRequest http) {
        access.assertUserAccess(inviterId,token);
        Long id=service.create(inviterId,request,http.getRemoteAddr());coordinator.process(id);return service.get(inviterId,id);
    }
    @PatchMapping("/{id}")
    public PreRegistrationResponse.Item edit(@PathVariable Long inviterId,@PathVariable Long id,
            @RequestHeader("X-Distribution-Token") String token,@Valid @RequestBody PreRegistrationRequest request,HttpServletRequest http) {
        access.assertUserAccess(inviterId,token);service.edit(inviterId,id,request,http.getRemoteAddr());
        coordinator.process(id);return service.get(inviterId,id);
    }
    @DeleteMapping("/{id}")
    public PreRegistrationResponse.Item withdraw(@PathVariable Long inviterId,@PathVariable Long id,@RequestParam long revision,
            @RequestHeader("X-Distribution-Token") String token,HttpServletRequest http) {
        access.assertUserAccess(inviterId,token);service.withdraw(inviterId,id,revision,http.getRemoteAddr());return service.get(inviterId,id);
    }
}
