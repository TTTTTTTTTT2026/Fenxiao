package com.fenxiao.distribution.entity;

import com.fenxiao.common.entity.BaseEntity;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "subordinate_pre_registration")
public class SubordinatePreRegistration extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private Long inviterId;
    private Long userId;
    private String countryCode;
    private String phoneNumber;
    private String platformCode;
    private String platformUserId;
    @Column(unique=true, length=32) private String activePhone;
    @Column(unique=true, length=100) private String activeAccount;
    private String status;
    private String reasonCode;
    private LocalDateTime submittedAt;
    private LocalDateTime expiresAt;
    private LocalDateTime nextCheckAt;
    private LocalDateTime lastCheckedAt;
    private LocalDateTime completedAt;
    private int attemptCount;
    @Version private long revision;

    protected SubordinatePreRegistration() {}
    public static SubordinatePreRegistration create(Long inviter, Long user, String country, String phone,
                                                    String platform, String account, LocalDateTime now) {
        var value = new SubordinatePreRegistration();
        value.inviterId = inviter; value.userId = user; value.submittedAt = now;
        value.expiresAt = now.plusHours(72); value.status = "PENDING";
        value.edit(country, phone, platform, account, now);
        return value;
    }
    public void edit(String country, String phone, String platform, String account, LocalDateTime now) {
        countryCode = country; phoneNumber = phone; platformCode = platform; platformUserId = account;
        activePhone = phone; activeAccount = platform + ":" + account;
        reasonCode = "WAITING"; nextCheckAt = now;
    }
    public void waiting(String reason, LocalDateTime now) {
        reasonCode = reason; lastCheckedAt = now; attemptCount++;
        nextCheckAt = now.plusMinutes(attemptCount < 3 ? 1 : attemptCount < 6 ? 5 : 30);
    }
    public void finish(String outcome, String reason, LocalDateTime now) {
        status = outcome; reasonCode = reason; completedAt = now;
        if ("COMPLETED".equals(outcome)) { lastCheckedAt = now; attemptCount++; }
        activePhone = null; activeAccount = null;
    }
    public boolean pending() { return "PENDING".equals(status); }
    public Long getId() { return id; }
    public Long getInviterId() { return inviterId; }
    public Long getUserId() { return userId; }
    public String getCountryCode() { return countryCode; }
    public String getPhoneNumber() { return phoneNumber; }
    public String getPlatformCode() { return platformCode; }
    public String getPlatformUserId() { return platformUserId; }
    public String getStatus() { return status; }
    public String getReasonCode() { return reasonCode; }
    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public LocalDateTime getNextCheckAt() { return nextCheckAt; }
    public LocalDateTime getLastCheckedAt() { return lastCheckedAt; }
    public int getAttemptCount() { return attemptCount; }
    public long getRevision() { return revision; }
}
