package com.fenxiao.platform.service;

import com.fenxiao.admin.service.AdminSessionService;
import com.fenxiao.audit.entity.OperationAuditLog;
import com.fenxiao.audit.repository.OperationAuditLogRepository;
import com.fenxiao.platform.dto.PlatformVerificationMockRequest;
import com.fenxiao.platform.dto.PlatformVerificationMockResponse;
import com.fenxiao.platform.dto.PlatformVerificationRuntimeResponse;
import com.fenxiao.platform.entity.PlatformVerificationMock;
import com.fenxiao.platform.repository.PlatformVerificationMockRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
@Transactional
public class PlatformVerificationMockAdminService {
    private final PlatformVerificationModeService mode;
    private final PlatformVerificationMockRepository mocks;
    private final OperationAuditLogRepository audits;
    private final Clock clock;

    public PlatformVerificationMockAdminService(PlatformVerificationModeService mode,
                                                PlatformVerificationMockRepository mocks,
                                                OperationAuditLogRepository audits,
                                                Clock clock) {
        this.mode = mode;
        this.mocks = mocks;
        this.audits = audits;
        this.clock = clock;
    }

    @Transactional(Transactional.TxType.SUPPORTS)
    public PlatformVerificationRuntimeResponse runtime() {
        return new PlatformVerificationRuntimeResponse(mode.source().name(), mode.mockManagementEnabled(), mode.explanation());
    }

    @Transactional(Transactional.TxType.SUPPORTS)
    public List<PlatformVerificationMockResponse> list() {
        mode.requireMockManagement();
        return mocks.findAllByOrderByPlatformCodeAscPlatformUserIdAsc().stream().map(PlatformVerificationMockResponse::from).toList();
    }

    public PlatformVerificationMockResponse save(PlatformVerificationMockRequest request,
                                                  AdminSessionService.AdminPrincipal actor, String requestIp) {
        mode.requireMockManagement();
        String platform = normalizePlatform(request.platformCode());
        String account = normalizeAccount(platform, request.platformUserId());
        PlatformVerificationMock existing = mocks.findByPlatformCodeAndPlatformUserId(platform, account).orElse(null);
        String before = existing == null ? null : snapshot(existing);
        PlatformVerificationMock value;
        if (existing == null) {
            value = PlatformVerificationMock.create(platform, account, request.globallySeenBeforeSubmission(), request.joinedTargetGuild(),
                    request.officialGuildId(), request.officialJoinedAt(), request.sourceReference(), request.enabled());
        } else {
            existing.update(request.globallySeenBeforeSubmission(), request.joinedTargetGuild(), request.officialGuildId(),
                    request.officialJoinedAt(), request.sourceReference(), request.enabled());
            value = existing;
        }
        PlatformVerificationMock saved = mocks.save(value);
        audits.save(OperationAuditLog.create(actor.accountId(), actor.role(), "PLATFORM_VERIFICATION_MOCK", "PLATFORM_ACCOUNT",
                saved.getId(), existing == null ? "CREATE_MOCK_VERIFICATION" : "UPDATE_MOCK_VERIFICATION", before, snapshot(saved),
                requestIp, "local/test mock verification record", LocalDateTime.now(clock)));
        return PlatformVerificationMockResponse.from(saved);
    }

    private String normalizePlatform(String value) {
        if (value == null || !value.trim().matches("^[A-Za-z][A-Za-z0-9_]{1,31}$")) throw new IllegalArgumentException("platform code is invalid");
        return value.trim().toUpperCase(Locale.ROOT);
    }
    private String normalizeAccount(String platform, String value) {
        if (value == null || !value.trim().matches("^[0-9]{5,32}$")) throw new IllegalArgumentException("platform user id must be numeric");
        String normalized = value.trim();
        if ("TIMO".equals(platform) && !normalized.matches("^[1-9][0-9]{11}$")) {
            throw new IllegalArgumentException("Timo id must be exactly 12 digits and cannot start with zero");
        }
        return normalized;
    }
    private String snapshot(PlatformVerificationMock value) {
        return "{\"platformCode\":\"" + value.getPlatformCode() + "\",\"platformUserId\":\"" + value.getPlatformUserId()
                + "\",\"globallySeenBeforeSubmission\":" + value.isGloballySeenBeforeSubmission()
                + ",\"joinedTargetGuild\":" + value.isJoinedTargetGuild() + ",\"officialGuildId\":\"" + value.getOfficialGuildId()
                + "\",\"enabled\":" + value.isEnabled() + "}";
    }
}
