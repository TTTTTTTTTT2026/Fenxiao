package com.fenxiao.distribution.service;

import com.fenxiao.admin.service.AdminPasswordHasher;
import com.fenxiao.admin.service.AdminPasswordPolicy;
import com.fenxiao.audit.entity.OperationAuditLog;
import com.fenxiao.audit.repository.OperationAuditLogRepository;
import com.fenxiao.common.api.ForbiddenException;
import com.fenxiao.identity.domain.AccountStatus;
import com.fenxiao.identity.entity.UserPasswordCredential;
import com.fenxiao.identity.repository.UserPasswordCredentialRepository;
import com.fenxiao.identity.service.UserSessionService;
import com.fenxiao.user.entity.UserDistributionProfile;
import com.fenxiao.user.repository.UserDistributionProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;

@Service
public class UserPasswordLoginService {
    private static final String INVALID_LOGIN = "phone or password invalid";

    private final UserDistributionProfileRepository users;
    private final UserPasswordCredentialRepository credentials;
    private final UserSessionService sessions;
    private final AdminPasswordHasher hasher;
    private final AdminPasswordPolicy policy;
    private final OperationAuditLogRepository audits;
    private final Clock clock;
    private final String dummyHash;

    public UserPasswordLoginService(UserDistributionProfileRepository users,
                                    UserPasswordCredentialRepository credentials,
                                    UserSessionService sessions,
                                    AdminPasswordHasher hasher,
                                    AdminPasswordPolicy policy,
                                    OperationAuditLogRepository audits,
                                    Clock clock) {
        this.users = users;
        this.credentials = credentials;
        this.sessions = sessions;
        this.hasher = hasher;
        this.policy = policy;
        this.audits = audits;
        this.clock = clock;
        this.dummyHash = hasher.hash("unavailable-user-password-credential");
    }

    @Transactional(noRollbackFor = ForbiddenException.class)
    public LoginResult login(String phoneNumber, String password) {
        String phone;
        try {
            phone = PhoneAuthService.normalizePhone(phoneNumber);
        } catch (IllegalArgumentException exception) {
            throw new ForbiddenException(INVALID_LOGIN);
        }
        UserDistributionProfile user = users.findByPhoneNumber(phone).orElse(null);
        UserPasswordCredential credential = user == null ? null : credentials.findForLogin(user.getUserId()).orElse(null);
        if (user == null || user.getAccountStatus() != AccountStatus.ACTIVE || credential == null || !credential.isEnabled()) {
            hasher.matches(password, dummyHash);
            throw new ForbiddenException(INVALID_LOGIN);
        }
        LocalDateTime now = LocalDateTime.now(clock);
        if (credential.isLockedAt(now)) throw new ForbiddenException(INVALID_LOGIN);
        if (!hasher.matches(password, credential.getPasswordHash())) {
            credential.recordFailure(now);
            throw new ForbiddenException(INVALID_LOGIN);
        }
        credential.clearFailures();
        UserSessionService.IssuedSession session = sessions.issue(user.getUserId());
        return new LoginResult(user, session);
    }

    @Transactional
    public boolean setPassword(Long userId, String password, Long operatorId, String operatorRole, String requestIp) {
        UserDistributionProfile user = users.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("user not found"));
        if (user.getPhoneNumber() == null || user.getPhoneNumber().isBlank()) {
            throw new IllegalArgumentException("user has no bound phone number");
        }
        if (user.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new IllegalArgumentException("user account is not active");
        }
        policy.validate(user.getPhoneNumber(), password);
        LocalDateTime now = LocalDateTime.now(clock);
        UserPasswordCredential credential = credentials.findById(userId).orElse(null);
        boolean previouslyEnabled = credential != null && credential.isEnabled();
        String hash = hasher.hash(password);
        if (credential == null) {
            credential = UserPasswordCredential.create(userId, hash, now);
        } else {
            credential.setPassword(hash, now);
            sessions.revokeAll(userId);
        }
        credentials.save(credential);
        audit(operatorId, operatorRole, userId, previouslyEnabled ? "RESET_PASSWORD_LOGIN" : "ENABLE_PASSWORD_LOGIN",
                previouslyEnabled, true, requestIp, now);
        return true;
    }

    @Transactional
    public boolean disable(Long userId, Long operatorId, String operatorRole, String requestIp) {
        UserPasswordCredential credential = credentials.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("password login not enabled"));
        if (!credential.isEnabled()) return false;
        credential.disable();
        sessions.revokeAll(userId);
        audit(operatorId, operatorRole, userId, "DISABLE_PASSWORD_LOGIN", true, false,
                requestIp, LocalDateTime.now(clock));
        return false;
    }

    private void audit(Long operatorId, String operatorRole, Long userId, String action,
                       boolean before, boolean after, String requestIp, LocalDateTime now) {
        audits.save(OperationAuditLog.create(operatorId, operatorRole, "user", "user_password_credential",
                userId, action, "enabled=" + before, "enabled=" + after, requestIp,
                "client password login permission changed; no password stored in audit", now));
    }

    public record LoginResult(UserDistributionProfile profile, UserSessionService.IssuedSession session) {}
}
