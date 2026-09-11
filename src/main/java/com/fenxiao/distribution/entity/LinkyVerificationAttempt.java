package com.fenxiao.distribution.entity;

import com.fenxiao.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "linky_verification_attempt")
public class LinkyVerificationAttempt extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;
    @Column(name = "linky_account", nullable = false, length = 32)
    private String linkyAccount;
    @Column(name = "expected_guild_id", nullable = false, length = 64)
    private String expectedGuildId;
    @Column(name = "verification_source", nullable = false, length = 16)
    private String verificationSource;
    @Column(name = "result_status", nullable = false, length = 32)
    private String resultStatus;
    @Column(name = "membership_status", length = 64)
    private String membershipStatus;
    @Column(name = "observed_guild_id", length = 64)
    private String observedGuildId;
    @Column(name = "request_id", length = 64)
    private String requestId;
    @Column(name = "snapshot_at", length = 64)
    private String snapshotAt;
    @Column(name = "source_generation", length = 128)
    private String sourceGeneration;
    @Column(name = "checksum", length = 128)
    private String checksum;
    @Column(name = "error_code", length = 128)
    private String errorCode;
    @Column(name = "retryable", nullable = false)
    private boolean retryable;
    @Column(name = "attempted_at", nullable = false)
    private LocalDateTime attemptedAt;

    protected LinkyVerificationAttempt() {}

    public static LinkyVerificationAttempt create(Long userId, String linkyAccount, String expectedGuildId,
                                                  String verificationSource, String resultStatus,
                                                  String membershipStatus, String observedGuildId, String requestId,
                                                  String snapshotAt, String sourceGeneration, String checksum,
                                                  String errorCode, boolean retryable) {
        LinkyVerificationAttempt value = new LinkyVerificationAttempt();
        value.userId = userId;
        value.linkyAccount = linkyAccount;
        value.expectedGuildId = expectedGuildId;
        value.verificationSource = verificationSource;
        value.resultStatus = resultStatus;
        value.membershipStatus = membershipStatus;
        value.observedGuildId = observedGuildId;
        value.requestId = requestId;
        value.snapshotAt = snapshotAt;
        value.sourceGeneration = sourceGeneration;
        value.checksum = checksum;
        value.errorCode = errorCode;
        value.retryable = retryable;
        value.attemptedAt = LocalDateTime.now(java.time.Clock.systemUTC());
        return value;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getLinkyAccount() { return linkyAccount; }
    public String getExpectedGuildId() { return expectedGuildId; }
    public String getVerificationSource() { return verificationSource; }
    public String getResultStatus() { return resultStatus; }
    public String getMembershipStatus() { return membershipStatus; }
    public String getObservedGuildId() { return observedGuildId; }
    public String getRequestId() { return requestId; }
    public String getSnapshotAt() { return snapshotAt; }
    public String getSourceGeneration() { return sourceGeneration; }
    public String getChecksum() { return checksum; }
    public String getErrorCode() { return errorCode; }
    public boolean isRetryable() { return retryable; }
    public LocalDateTime getAttemptedAt() { return attemptedAt; }
}
