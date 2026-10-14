package com.fenxiao.incentive.api;

import com.fenxiao.common.security.DistributionAccessGuard;
import com.fenxiao.incentive.dto.PointCurrencyReferenceDtos.*;
import com.fenxiao.incentive.service.PointCurrencyReferenceService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;

@RestController
@RequestMapping("/admin/finance/point-currency-rates")
public class PointCurrencyReferenceAdminController {
    private final DistributionAccessGuard guard;
    private final PointCurrencyReferenceService service;
    public PointCurrencyReferenceAdminController(DistributionAccessGuard guard,PointCurrencyReferenceService service) {this.guard=guard;this.service=service;}

    @GetMapping
    public Dashboard dashboard(@RequestHeader(value="X-Admin-Token",required=false)String token,@RequestHeader(value="X-Admin-Session",required=false)String session) {
        guard.assertFinanceAccess(token,session);return service.dashboard();
    }
    @PutMapping("/{country}")
    public Setting save(@RequestHeader(value="X-Admin-Token",required=false)String token,@RequestHeader(value="X-Admin-Session",required=false)String session,
                        @PathVariable String country,@Valid @RequestBody SaveRequest request) {
        return service.save(country,request,guard.assertFinanceAccess(token,session));
    }
    @GetMapping("/{country}/history")
    public History history(@RequestHeader(value="X-Admin-Token",required=false)String token,@RequestHeader(value="X-Admin-Session",required=false)String session,
                           @PathVariable String country,@RequestParam(required=false)Integer beforeVersion) {
        guard.assertFinanceAccess(token,session);return service.history(country,beforeVersion);
    }
    @PostMapping("/preview")
    public Quote preview(@RequestHeader(value="X-Admin-Token",required=false)String token,@RequestHeader(value="X-Admin-Session",required=false)String session,
                         @Valid @RequestBody PreviewRequest request) {
        return service.preview(request,guard.assertFinanceAccess(token,session));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String,String>> businessStatus(ResponseStatusException error) {
        return ResponseEntity.status(error.getStatusCode()).body(Map.of("message",error.getReason()==null?"请求失败":error.getReason()));
    }
}
