package com.fenxiao.distribution.entity;

import com.fenxiao.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "sms_daily_whitelist", uniqueConstraints = @UniqueConstraint(
        name = "uk_sms_daily_whitelist_phone", columnNames = "phone_number"))
public class SmsDailyWhitelistEntry extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "phone_number", nullable = false, length = 32)
    private String phoneNumber;

    @Column(name = "created_by", nullable = false)
    private Long createdBy;

    protected SmsDailyWhitelistEntry() {}

    public static SmsDailyWhitelistEntry create(String phoneNumber, long createdBy) {
        SmsDailyWhitelistEntry entry = new SmsDailyWhitelistEntry();
        entry.phoneNumber = phoneNumber;
        entry.createdBy = createdBy;
        return entry;
    }

    public Long getId() { return id; }
    public String getPhoneNumber() { return phoneNumber; }
    public Long getCreatedBy() { return createdBy; }
}
