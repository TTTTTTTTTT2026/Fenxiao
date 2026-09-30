package com.fenxiao.identity.entity;

import com.fenxiao.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_password_credential")
public class UserPasswordCredential extends BaseEntity {
    @Id
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "password_hash", nullable = false, length = 256)
    private String passwordHash;

    @Column(name = "enabled", nullable = false)
    private boolean enabled;

    @Column(name = "failed_attempts", nullable = false)
    private int failedAttempts;

    @Column(name = "locked_until")
    private LocalDateTime lockedUntil;

    @Column(name = "password_changed_at", nullable = false)
    private LocalDateTime passwordChangedAt;

    protected UserPasswordCredential() {}

    public static UserPasswordCredential create(Long userId, String passwordHash, LocalDateTime now) {
        UserPasswordCredential value = new UserPasswordCredential();
        value.userId = userId;
        value.setPassword(passwordHash, now);
        return value;
    }

    public Long getUserId() { return userId; }
    public String getPasswordHash() { return passwordHash; }
    public boolean isEnabled() { return enabled; }
    public int getFailedAttempts() { return failedAttempts; }
    public LocalDateTime getLockedUntil() { return lockedUntil; }
    public LocalDateTime getPasswordChangedAt() { return passwordChangedAt; }

    public void setPassword(String hash, LocalDateTime now) {
        passwordHash = hash;
        passwordChangedAt = now;
        enabled = true;
        failedAttempts = 0;
        lockedUntil = null;
    }

    public void disable() {
        enabled = false;
        failedAttempts = 0;
        lockedUntil = null;
    }

    public boolean isLockedAt(LocalDateTime now) {
        return lockedUntil != null && lockedUntil.isAfter(now);
    }

    public void recordFailure(LocalDateTime now) {
        failedAttempts++;
        if (failedAttempts >= 5) {
            failedAttempts = 0;
            lockedUntil = now.plusMinutes(15);
        }
    }

    public void clearFailures() {
        failedAttempts = 0;
        lockedUntil = null;
    }
}
