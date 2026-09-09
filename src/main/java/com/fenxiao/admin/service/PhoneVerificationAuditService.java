package com.fenxiao.admin.service;

import com.fenxiao.admin.api.dto.AuditLogListItem;
import com.fenxiao.admin.api.dto.AuditLogListResponse;
import com.fenxiao.admin.api.dto.PhoneVerificationCodeListItem;
import com.fenxiao.admin.api.dto.PhoneVerificationCodeListResponse;
import com.fenxiao.admin.api.dto.PhoneVerificationCodeRevealResponse;
import com.fenxiao.audit.entity.OperationAuditLog;
import com.fenxiao.audit.repository.OperationAuditLogRepository;
import com.fenxiao.distribution.entity.PhoneVerificationCode;
import com.fenxiao.distribution.repository.PhoneVerificationCodeRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class PhoneVerificationAuditService {
    private static final String MODULE = "phone_verification";
    private static final String TARGET_TYPE = "phone_verification_code";
    private final PhoneVerificationCodeRepository codes;
    private final OperationAuditLogRepository audits;
    private final Clock clock;

    @Autowired
    public PhoneVerificationAuditService(PhoneVerificationCodeRepository codes, OperationAuditLogRepository audits) {
        this(codes, audits, Clock.systemUTC());
    }

    PhoneVerificationAuditService(PhoneVerificationCodeRepository codes, OperationAuditLogRepository audits, Clock clock) {
        this.codes = codes;
        this.audits = audits;
        this.clock = clock;
    }

    @Transactional
    public PhoneVerificationCodeListResponse list(String phoneNumber, int page, int size, AdminSessionService.AdminPrincipal actor, String requestIp) {
        validatePage(page, size);
        String normalizedPhone = phoneNumber == null ? "" : phoneNumber.trim();
        Page<PhoneVerificationCode> result = normalizedPhone.isBlank()
                ? codes.findAllByOrderByIdDesc(PageRequest.of(page, size))
                : codes.findByPhoneNumberContainingOrderByIdDesc(normalizedPhone, PageRequest.of(page, size));
        audit(actor, 0L, "VIEW_VERIFICATION_CODE_LIST", requestIp, "page=" + page + ",size=" + size + ",phoneFilter=" + maskPhone(normalizedPhone));
        return new PhoneVerificationCodeListResponse(result.getContent().stream().map(this::item).toList(), result.getTotalElements(), page, size);
    }

    @Transactional
    public PhoneVerificationCodeRevealResponse reveal(long id, AdminSessionService.AdminPrincipal actor, String requestIp) {
        PhoneVerificationCode code = codes.findById(id).orElseThrow(() -> new IllegalArgumentException("phone verification code not found"));
        audit(actor, id, "REVEAL_VERIFICATION_CODE", requestIp, "purpose=" + code.getPurpose() + ",phone=" + maskPhone(code.getPhoneNumber()));
        return new PhoneVerificationCodeRevealResponse(id, code.getVerificationCode(), status(code), code.getExpiresAt());
    }

    @Transactional(readOnly = true)
    public AuditLogListResponse auditTrail(long id, int page, int size) {
        validatePage(page, size);
        Page<OperationAuditLog> logs = audits.findByAuditTarget(MODULE, TARGET_TYPE, id, PageRequest.of(page, size));
        List<AuditLogListItem> items = logs.getContent().stream().map(log -> new AuditLogListItem(
                log.getId(), log.getModuleName(), log.getTargetType(), log.getTargetId(), log.getActionName(),
                log.getOperatorRole(), log.getOperatorId(), log.getRequestIp(), log.getRemark(), log.getOperatedAt()
        )).toList();
        return new AuditLogListResponse(items, logs.getTotalElements(), page, size);
    }

    private PhoneVerificationCodeListItem item(PhoneVerificationCode code) {
        return new PhoneVerificationCodeListItem(code.getId(), code.getPhoneNumber(), code.getPurpose(), status(code),
                code.getAttempts(), code.isConsumed(), code.getCreatedAt(), code.getExpiresAt(), code.getUpdatedAt());
    }

    private String status(PhoneVerificationCode code) {
        if (code.isConsumed()) return "CONSUMED";
        if (!code.getExpiresAt().isAfter(LocalDateTime.now(clock))) return "EXPIRED";
        return "ACTIVE";
    }

    private void audit(AdminSessionService.AdminPrincipal actor, long targetId, String action, String requestIp, String remark) {
        audits.save(OperationAuditLog.create(actor.accountId(), actor.role(), MODULE, TARGET_TYPE, targetId, action,
                null, null, requestIp, remark, LocalDateTime.now(clock)));
    }

    private void validatePage(int page, int size) {
        if (page < 0) throw new IllegalArgumentException("page must be greater than or equal to 0");
        if (size < 1 || size > 100) throw new IllegalArgumentException("size must be between 1 and 100");
    }

    private String maskPhone(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.isBlank()) return "-";
        if (phoneNumber.length() <= 6) return "[REDACTED]";
        return phoneNumber.substring(0, 3) + "****" + phoneNumber.substring(phoneNumber.length() - 3);
    }
}
