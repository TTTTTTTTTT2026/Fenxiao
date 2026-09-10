package com.fenxiao.platform.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "platform_integration_config")
public class PlatformIntegrationConfig {
    @Id
    @Column(name = "platform_code", nullable = false, length = 32)
    private String platformCode;
    @Column(name = "display_name", nullable = false, length = 64)
    private String displayName;
    @Column(name = "primary_account_identifier", nullable = false, length = 64)
    private String primaryAccountIdentifier;
    @Column(name = "account_identifier_note", nullable = false, length = 255)
    private String accountIdentifierNote;
    @Column(name = "mcn_integration_status", nullable = false, length = 32)
    private String mcnIntegrationStatus;
    @Column(name = "revenue_ingestion_mode", nullable = false, length = 32)
    private String revenueIngestionMode;
    @Column(name = "reward_mode", nullable = false, length = 32)
    private String rewardMode;
    @Column(name = "enabled", nullable = false)
    private boolean enabled;

    protected PlatformIntegrationConfig() {}

    public String getPlatformCode() { return platformCode; }
    public String getDisplayName() { return displayName; }
    public String getPrimaryAccountIdentifier() { return primaryAccountIdentifier; }
    public String getAccountIdentifierNote() { return accountIdentifierNote; }
    public String getMcnIntegrationStatus() { return mcnIntegrationStatus; }
    public String getRevenueIngestionMode() { return revenueIngestionMode; }
    public String getRewardMode() { return rewardMode; }
    public boolean isEnabled() { return enabled; }
}
