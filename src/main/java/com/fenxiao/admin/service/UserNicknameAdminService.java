package com.fenxiao.admin.service;

import com.fenxiao.audit.entity.OperationAuditLog;
import com.fenxiao.audit.repository.OperationAuditLogRepository;
import com.fenxiao.user.entity.UserPublicProfile;
import com.fenxiao.user.repository.UserDistributionProfileRepository;
import com.fenxiao.user.repository.UserPublicProfileRepository;
import com.fenxiao.user.service.UserPublicProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Objects;

@Service
public class UserNicknameAdminService {
    private final UserDistributionProfileRepository users;
    private final UserPublicProfileRepository profiles;
    private final OperationAuditLogRepository auditLogs;
    private final Clock clock;

    @Autowired
    public UserNicknameAdminService(UserDistributionProfileRepository users,
                                    UserPublicProfileRepository profiles,
                                    OperationAuditLogRepository auditLogs) {
        this(users, profiles, auditLogs, Clock.systemUTC());
    }

    UserNicknameAdminService(UserDistributionProfileRepository users,
                             UserPublicProfileRepository profiles,
                             OperationAuditLogRepository auditLogs, Clock clock) {
        this.users = users;
        this.profiles = profiles;
        this.auditLogs = auditLogs;
        this.clock = clock;
    }

    @Transactional
    public NicknameUpdate changeNickname(Long userId, String value, AdminSessionService.AdminPrincipal actor, String requestIp) {
        if (userId == null || userId <= 0 || !users.existsById(userId))
            throw new IllegalArgumentException("user not found");
        String nickname = value == null || value.isBlank() ? null : UserPublicProfileService.normalizeNickname(value);
        UserPublicProfile profile = profiles.findById(userId).orElse(null);
        String before = profile == null ? null : profile.getNickname();
        if (Objects.equals(before, nickname)) return new NicknameUpdate(userId, nickname);
        if (profile == null) profile = UserPublicProfile.forUser(userId);
        profile.setNickname(nickname);
        profiles.save(profile);
        auditLogs.save(OperationAuditLog.create(actor.accountId(), actor.role(), "user", "user_public_profile",
                userId, "CHANGE_NICKNAME", before, nickname, requestIp,
                "manual user nickname adjustment", LocalDateTime.now(clock)));
        return new NicknameUpdate(userId, nickname);
    }

    public record NicknameUpdate(Long userId, String nickname) {}
}
