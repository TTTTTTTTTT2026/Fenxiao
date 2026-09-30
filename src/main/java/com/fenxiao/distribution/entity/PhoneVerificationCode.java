package com.fenxiao.distribution.entity;

import com.fenxiao.common.entity.BaseEntity;
import jakarta.persistence.*;
import java.time.Clock;
import java.time.LocalDateTime;

@Entity
@Table(name = "phone_verification_code")
public class PhoneVerificationCode extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "phone_number", nullable = false, length = 32)
    private String phoneNumber;
    @Column(name = "verification_code", nullable = false, length = 16)
    private String verificationCode;
    @Column(name = "purpose", nullable = false, length = 32)
    private String purpose;
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;
    @Column(name = "attempts", nullable = false)
    private int attempts;
    @Column(name = "consumed", nullable = false)
    private boolean consumed;
    @Column(name = "delivery_channel", nullable = false, length = 24)
    private String deliveryChannel;
    @Column(name = "delivery_status", nullable = false, length = 24)
    private String deliveryStatus;
    @Column(name = "delivery_error_code", length = 64)
    private String deliveryErrorCode;

    protected PhoneVerificationCode() {}
    public Long getId() { return id; }
    public String getPhoneNumber() { return phoneNumber; }
    public String getVerificationCode() { return verificationCode; }
    public String getPurpose() { return purpose; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public int getAttempts() { return attempts; }
    public boolean isConsumed() { return consumed; }
    public String getDeliveryChannel() { return deliveryChannel; }
    public String getDeliveryStatus() { return deliveryStatus; }
    public String getDeliveryErrorCode() { return deliveryErrorCode; }

    public static PhoneVerificationCode issue(String phoneNumber, String code, String purpose, LocalDateTime expiresAt) {
        PhoneVerificationCode v = new PhoneVerificationCode();
        v.phoneNumber = phoneNumber;
        v.verificationCode = code;
        v.purpose = purpose;
        v.expiresAt = expiresAt;
        v.attempts = 0;
        v.consumed = false;
        v.deliveryChannel = "UNKNOWN";
        v.deliveryStatus = "PENDING";
        return v;
    }
    public void setDeliveryChannel(String channel) { this.deliveryChannel = channel; }
    public void markSubmissionAccepted() { this.deliveryStatus = "ACCEPTED"; this.deliveryErrorCode = null; }
    public void markSubmissionFailed(String errorCode) { this.deliveryStatus = "FAILED"; this.deliveryErrorCode = errorCode; }
    public void failAttempt() { this.attempts++; }
    public void consume() { this.consumed = true; }
    public void expireAt(LocalDateTime at) { this.expiresAt = at; }
    public boolean expired(Clock clock) { return !expiresAt.isAfter(LocalDateTime.now(clock)); }
}
