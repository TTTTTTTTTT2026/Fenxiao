package com.fenxiao.platform.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "platform_binding_reset_archive")
public class PlatformBindingResetArchive {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "user_id", nullable = false)
    private Long userId;
    @Column(name = "platform_code", nullable = false, length = 32)
    private String platformCode;
    @Column(name = "binding_id", nullable = false)
    private Long bindingId;
    @Column(name = "platform_user_id", nullable = false, length = 64)
    private String platformUserId;
    @Column(name = "previously_verified", nullable = false)
    private boolean previouslyVerified;
    @Lob @Column(name = "snapshot_data", nullable = false, columnDefinition = "LONGTEXT")
    private String snapshotData;
    @Column(name = "reset_at", nullable = false)
    private LocalDateTime resetAt;

    protected PlatformBindingResetArchive() {}
}
