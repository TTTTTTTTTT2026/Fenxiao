package com.fenxiao.distribution.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "sms_delivery_control")
public class SmsDeliveryControl {
    @Id
    private Long id;

    @Column(name = "enabled", nullable = false)
    private boolean enabled;

    @Column(name = "updated_by")
    private Long updatedBy;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected SmsDeliveryControl() {}

    public static SmsDeliveryControl disabled() {
        SmsDeliveryControl control = new SmsDeliveryControl();
        control.id = 1L;
        control.enabled = false;
        return control;
    }

    public void change(boolean enabled, long actorId, LocalDateTime at) {
        this.enabled = enabled;
        this.updatedBy = actorId;
        this.updatedAt = at;
    }

    public boolean isEnabled() { return enabled; }
    public Long getUpdatedBy() { return updatedBy; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
