package com.fenxiao.distribution.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_earnings_read_access", uniqueConstraints = @UniqueConstraint(name = "uk_user_earnings_read_access", columnNames = {"user_id", "platform_code"}))
public class UserEarningsReadAccess {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "user_id", nullable = false) private Long userId;
    @Column(name = "platform_code", nullable = false, length = 32) private String platformCode;
    @Column(nullable = false) private boolean enabled;
    @Column(name = "version_no", nullable = false) private long version;
    @Column(name = "updated_by", nullable = false) private long updatedBy;
    @Column(name = "updated_at", nullable = false) private LocalDateTime updatedAt;
    protected UserEarningsReadAccess() {}
    public static UserEarningsReadAccess create(long userId, String platformCode) {
        var value = new UserEarningsReadAccess(); value.userId = userId; value.platformCode = platformCode; return value;
    }
    public void change(boolean enabled, long actor, LocalDateTime now) {
        this.enabled = enabled; this.version++; this.updatedBy = actor; this.updatedAt = now;
    }
    public Long getUserId() { return userId; }
    public String getPlatformCode() { return platformCode; }
    public boolean isEnabled() { return enabled; }
    public long getVersion() { return version; }
}
