package com.fenxiao.distribution.service;

import com.fenxiao.admin.service.AdminSessionService;
import com.fenxiao.audit.entity.OperationAuditLog;
import com.fenxiao.audit.repository.OperationAuditLogRepository;
import com.fenxiao.distribution.entity.SmsDailyWhitelistEntry;
import com.fenxiao.distribution.repository.SmsDailyWhitelistRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;

@Service
public class SmsDailyWhitelistService {
    private final SmsDailyWhitelistRepository entries;
    private final OperationAuditLogRepository audits;
    private final Clock clock = Clock.systemUTC();

    public SmsDailyWhitelistService(SmsDailyWhitelistRepository entries, OperationAuditLogRepository audits) {
        this.entries = entries;
        this.audits = audits;
    }

    @Transactional(readOnly = true)
    public boolean isExempt(String normalizedPhoneNumber) {
        return entries.existsByPhoneNumber(normalizedPhoneNumber);
    }

    @Transactional(readOnly = true)
    public WhitelistPage list(int page, int size) {
        if (page < 0 || size < 1 || size > 100) throw new IllegalArgumentException("invalid whitelist page or size");
        Page<SmsDailyWhitelistEntry> result = entries.findAllByOrderByIdDesc(PageRequest.of(page, size));
        return new WhitelistPage(result.getContent().stream().map(this::item).toList(), result.getTotalElements(), page, size);
    }

    @Transactional
    public WhitelistItem add(String phoneNumber, AdminSessionService.AdminPrincipal actor, String requestIp) {
        String normalized = normalizeInternationalPhone(phoneNumber);
        if (entries.existsByPhoneNumber(normalized)) throw new IllegalArgumentException("phone number is already on the SMS daily whitelist");
        SmsDailyWhitelistEntry saved = entries.save(SmsDailyWhitelistEntry.create(normalized, actor.accountId()));
        audits.save(OperationAuditLog.create(actor.accountId(), actor.role(), "sms_daily_whitelist", "phone_number",
                saved.getId(), "ADD_SMS_DAILY_WHITELIST", "absent", "present", requestIp,
                "phone=" + maskPhone(normalized), LocalDateTime.now(clock)));
        return item(saved);
    }

    @Transactional
    public void remove(long id, AdminSessionService.AdminPrincipal actor, String requestIp) {
        SmsDailyWhitelistEntry entry = entries.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("SMS daily whitelist entry not found"));
        entries.delete(entry);
        audits.save(OperationAuditLog.create(actor.accountId(), actor.role(), "sms_daily_whitelist", "phone_number",
                id, "REMOVE_SMS_DAILY_WHITELIST", "present", "absent", requestIp,
                "phone=" + maskPhone(entry.getPhoneNumber()), LocalDateTime.now(clock)));
    }

    private WhitelistItem item(SmsDailyWhitelistEntry entry) {
        return new WhitelistItem(entry.getId(), entry.getPhoneNumber(), entry.getCreatedAt(), entry.getCreatedBy());
    }

    private String normalizeInternationalPhone(String phoneNumber) {
        String normalized = phoneNumber == null ? "" : phoneNumber.replaceAll("[\\s()-]", "").trim();
        if (!normalized.matches("^\\+[1-9][0-9]{5,19}$")) {
            throw new IllegalArgumentException("enter a full international phone number starting with + and country code");
        }
        return normalized;
    }

    private String maskPhone(String phoneNumber) {
        if (phoneNumber.length() <= 6) return "[REDACTED]";
        return phoneNumber.substring(0, 3) + "****" + phoneNumber.substring(phoneNumber.length() - 3);
    }

    public record WhitelistItem(Long id, String phoneNumber, LocalDateTime createdAt, Long createdBy) {}
    public record WhitelistPage(java.util.List<WhitelistItem> items, long total, int page, int size) {}
}
