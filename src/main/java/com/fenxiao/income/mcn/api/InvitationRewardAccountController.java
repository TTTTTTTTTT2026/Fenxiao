package com.fenxiao.income.mcn.api;

import com.fenxiao.common.security.DistributionAccessGuard;
import com.fenxiao.audit.entity.OperationAuditLog;
import com.fenxiao.audit.repository.OperationAuditLogRepository;
import com.fenxiao.income.mcn.api.dto.InvitationRewardAccountResponse;
import com.fenxiao.income.mcn.service.InvitationRewardAccountQueryService;
import com.fenxiao.income.mcn.service.ManualPointsAdjustmentService;
import com.fenxiao.incentive.service.PointCurrencyReferenceService;
import com.fenxiao.incentive.dto.PointCurrencyReferenceDtos.Quote;
import com.fenxiao.distribution.service.ConsumerWorkspaceService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.math.BigDecimal;

@RestController
@RequestMapping
public class InvitationRewardAccountController {
    private final DistributionAccessGuard access;
    private final InvitationRewardAccountQueryService accounts;
    private final OperationAuditLogRepository auditLogs;
    private final Clock clock;
    private final ConsumerWorkspaceService workspaces;
    private final ManualPointsAdjustmentService manualAdjustments;
    private final PointCurrencyReferenceService currency;

    public InvitationRewardAccountController(DistributionAccessGuard access, InvitationRewardAccountQueryService accounts,
            OperationAuditLogRepository auditLogs, Clock clock, ConsumerWorkspaceService workspaces,
            ManualPointsAdjustmentService manualAdjustments, PointCurrencyReferenceService currency) {
        this.access = access;
        this.accounts = accounts;
        this.auditLogs = auditLogs;
        this.clock = clock;
        this.workspaces = workspaces;
        this.manualAdjustments = manualAdjustments;
        this.currency = currency;
    }

    public record ReferenceValues(Quote available, Quote frozen, Quote total, Quote income, Quote direct, Quote indirect) { }
    public record ReferenceQuoteRequest(String platformCode, List<BigDecimal> points) { }

    @PostMapping("/api/distribution/accounts/{userId}/reference-quotes")
    public List<Quote> referenceQuotes(@RequestHeader("X-Distribution-Token") String token,
            @PathVariable long userId, @RequestBody ReferenceQuoteRequest request) {
        access.assertUserAccess(userId, token);
        if (request==null || request.points()==null || request.points().size()>100 || request.points().isEmpty())
            throw new IllegalArgumentException("invalid points list");
        workspaces.requireEarningsRead(userId, request.platformCode());
        if (request.points().stream().anyMatch(value->value==null || value.scale()>6 || value.precision()-value.scale()>12))
            throw new IllegalArgumentException("invalid points value");
        return currency.quotesForUser(userId, request.points());
    }

    @GetMapping("/api/distribution/accounts/{userId}/reference-values")
    public ReferenceValues referenceValues(@RequestHeader("X-Distribution-Token") String token,
            @PathVariable long userId, @RequestParam String platformCode) {
        access.assertUserAccess(userId, token);
        String platform=workspaces.requireEarningsRead(userId, platformCode);
        var account=accounts.get(userId, 0, 1, platform);
        var values=currency.quotesForUser(userId,List.of(account.availablePoints(), account.frozenPoints(), account.totalPoints(),
                account.cumulativeIncomePoints(), account.directIncomePoints(), account.indirectIncomePoints()));
        return new ReferenceValues(values.get(0),values.get(1),values.get(2),values.get(3),values.get(4),values.get(5));
    }

    @PostMapping("/admin/invitation-accounts/{userId}/adjustments")
    public ManualPointsAdjustmentService.Result adjust(@RequestHeader(value="X-Admin-Session", required=false) String session,
            @PathVariable long userId, @RequestBody ManualPointsAdjustmentService.Request request) {
        return manualAdjustments.adjust(userId, request, access.assertFinanceAccess(null, session));
    }

    @GetMapping("/admin/invitation-accounts/{userId}/adjustment-preview")
    public ManualPointsAdjustmentService.Preview adjustmentPreview(@RequestHeader(value="X-Admin-Session", required=false) String session,
            @PathVariable long userId, @RequestParam String platformCode) {
        return manualAdjustments.preview(userId, platformCode, access.assertFinanceAccess(null, session));
    }

    @GetMapping("/admin/invitation-account-adjustments")
    public ManualPointsAdjustmentService.RecordPage adjustmentRecords(@RequestHeader(value="X-Admin-Session", required=false) String session,
            @RequestParam(defaultValue="0") int page) {
        return manualAdjustments.records(page, access.assertFinanceAccess(null, session));
    }

    @GetMapping("/admin/invitation-account-adjustments/users/{userId}")
    public ManualPointsAdjustmentService.UserInfo adjustmentUser(@RequestHeader(value="X-Admin-Session", required=false) String session,
            @PathVariable long userId) {
        return manualAdjustments.userInfo(userId, access.assertFinanceAccess(null, session));
    }

    @GetMapping("/api/distribution/accounts/{userId}")
    public InvitationRewardAccountResponse consumer(@RequestHeader("X-Distribution-Token") String token,
            @PathVariable long userId, @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String platformCode) {
        access.assertUserAccess(userId, token);
        return accounts.get(userId, page, size, platformCode == null ? null : workspaces.requireEarningsRead(userId, platformCode));
    }

    @GetMapping("/admin/invitation-accounts/{userId}")
    public InvitationRewardAccountResponse admin(
            @RequestHeader(value = "X-Admin-Token", required = false) String token,
            @RequestHeader(value = "X-Admin-Session", required = false) String session,
            @PathVariable long userId, @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var actor = access.assertFinanceAccess(token, session);
        InvitationRewardAccountResponse result = accounts.get(userId, page, size);
        auditLogs.save(OperationAuditLog.create(actor.accountId(), actor.role(), "invitation_reward_account",
                "user", userId, "READ_ACCOUNT", null, null, null,
                "财务按用户 ID 查询账户，第 " + Math.max(0, page) + " 页", LocalDateTime.now(clock)));
        return result;
    }
}
