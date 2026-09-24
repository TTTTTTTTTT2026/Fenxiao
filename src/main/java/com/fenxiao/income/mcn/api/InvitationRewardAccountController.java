package com.fenxiao.income.mcn.api;

import com.fenxiao.common.security.DistributionAccessGuard;
import com.fenxiao.audit.entity.OperationAuditLog;
import com.fenxiao.audit.repository.OperationAuditLogRepository;
import com.fenxiao.income.mcn.api.dto.InvitationRewardAccountResponse;
import com.fenxiao.income.mcn.service.InvitationRewardAccountQueryService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Clock;
import java.time.LocalDateTime;

@RestController
@RequestMapping
public class InvitationRewardAccountController {
    private final DistributionAccessGuard access;
    private final InvitationRewardAccountQueryService accounts;
    private final OperationAuditLogRepository auditLogs;
    private final Clock clock;

    public InvitationRewardAccountController(DistributionAccessGuard access, InvitationRewardAccountQueryService accounts,
            OperationAuditLogRepository auditLogs, Clock clock) {
        this.access = access;
        this.accounts = accounts;
        this.auditLogs = auditLogs;
        this.clock = clock;
    }

    @GetMapping("/api/distribution/accounts/{userId}")
    public InvitationRewardAccountResponse consumer(@RequestHeader("X-Distribution-Token") String token,
            @PathVariable long userId, @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        access.assertUserAccess(userId, token);
        return accounts.get(userId, page, size);
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
