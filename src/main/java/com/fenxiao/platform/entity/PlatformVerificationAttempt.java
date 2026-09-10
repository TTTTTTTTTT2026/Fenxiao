package com.fenxiao.platform.entity;

import com.fenxiao.common.entity.BaseEntity;
import com.fenxiao.platform.service.PlatformVerificationResult;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "platform_verification_attempt")
public class PlatformVerificationAttempt extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "binding_id", nullable = false) private Long bindingId;
    @Column(name = "user_id", nullable = false) private Long userId;
    @Column(name = "platform_code", nullable = false, length = 32) private String platformCode;
    @Column(name = "platform_user_id", nullable = false, length = 64) private String platformUserId;
    @Column(name = "source_system", nullable = false, length = 64) private String sourceSystem;
    @Column(name = "request_id", length = 128) private String requestId;
    @Column(name = "outcome", nullable = false, length = 32) private String outcome;
    @Column(name = "error_code", length = 96) private String errorCode;
    @Column(name = "retryable", nullable = false) private boolean retryable;
    @Column(name = "expected_guild_id", length = 64) private String expectedGuildId;
    @Column(name = "expected_country", length = 64) private String expectedCountry;
    @Column(name = "official_guild_id", length = 64) private String officialGuildId;
    @Column(name = "official_joined_at") private LocalDateTime officialJoinedAt;
    @Column(name = "snapshot_at", length = 64) private String snapshotAt;
    @Column(name = "source_generation", length = 128) private String sourceGeneration;
    @Column(name = "checksum", length = 160) private String checksum;
    @Column(name = "source_reference", length = 255) private String sourceReference;
    @Column(name = "attempted_at", nullable = false) private LocalDateTime attemptedAt;

    protected PlatformVerificationAttempt() {}

    public static PlatformVerificationAttempt record(PlatformAccountBinding binding, String expectedGuildId,
                                                     String expectedCountry, PlatformVerificationResult result,
                                                     LocalDateTime attemptedAt) {
        PlatformVerificationAttempt value = new PlatformVerificationAttempt();
        value.bindingId = binding.getId();
        value.userId = binding.getUserId();
        value.platformCode = binding.getPlatformCode();
        value.platformUserId = binding.getPlatformUserId();
        value.sourceSystem = result.sourceSystem();
        value.requestId = result.requestId();
        value.outcome = result.outcome().name();
        value.errorCode = result.errorCode();
        value.retryable = result.retryable();
        value.expectedGuildId = expectedGuildId;
        value.expectedCountry = expectedCountry;
        value.officialGuildId = result.officialGuildId();
        value.officialJoinedAt = result.officialJoinedAt();
        value.snapshotAt = result.snapshotAt();
        value.sourceGeneration = result.sourceGeneration();
        value.checksum = result.checksum();
        value.sourceReference = result.sourceReference();
        value.attemptedAt = attemptedAt;
        return value;
    }

    public static PlatformVerificationAttempt manualReviewRequired(PlatformAccountBinding binding, LocalDateTime attemptedAt) {
        PlatformVerificationAttempt value = new PlatformVerificationAttempt();
        value.bindingId = binding.getId();
        value.userId = binding.getUserId();
        value.platformCode = binding.getPlatformCode();
        value.platformUserId = binding.getPlatformUserId();
        value.sourceSystem = "MCN_TIMO";
        value.outcome = "MANUAL_REVIEW_REQUIRED";
        value.errorCode = "retry_exhausted";
        value.retryable = false;
        value.attemptedAt = attemptedAt;
        return value;
    }

    public Long getBindingId() { return bindingId; }
    public boolean isRetryable() { return retryable; }
    public LocalDateTime getAttemptedAt() { return attemptedAt; }
}
