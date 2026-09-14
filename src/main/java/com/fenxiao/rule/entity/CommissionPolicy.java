package com.fenxiao.rule.entity;

import com.fenxiao.common.entity.BaseEntity;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Versioned invitation-commission configuration for the candidate ledger. It excludes mentor commission and operating dividends. */
@Entity
@Table(name = "commission_policy")
public class CommissionPolicy extends BaseEntity {
    public static final String DRAFT = "DRAFT";
    public static final String ACTIVE = "ACTIVE";
    public static final String RETIRED = "RETIRED";
    public static final String INVITATION = "INVITATION";

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "policy_code", nullable = false, length = 64) private String policyCode;
    @Column(name = "commission_type", nullable = false, length = 32) private String commissionType;
    @Column(name = "platform_code", nullable = false, length = 32) private String platformCode;
    @Column(name = "country_code", nullable = false, length = 10) private String countryCode;
    @Column(name = "role_code", nullable = false, length = 32) private String roleCode;
    @Column(name = "max_reward_level", nullable = false) private int maxRewardLevel;
    @Column(name = "level1_enabled", nullable = false) private boolean level1Enabled;
    @Column(name = "level1_rate", precision = 8, scale = 6) private BigDecimal level1Rate;
    @Column(name = "level1_freeze_days") private Integer level1FreezeDays;
    @Column(name = "level2_enabled", nullable = false) private boolean level2Enabled;
    @Column(name = "level2_rate", precision = 8, scale = 6) private BigDecimal level2Rate;
    @Column(name = "level2_freeze_days") private Integer level2FreezeDays;
    @Column(name = "level3_enabled", nullable = false) private boolean level3Enabled;
    @Column(name = "level3_rate", precision = 8, scale = 6) private BigDecimal level3Rate;
    @Column(name = "level3_freeze_days") private Integer level3FreezeDays;
    @Column(name = "effective_from", nullable = false) private LocalDateTime effectiveFrom;
    @Column(name = "effective_to") private LocalDateTime effectiveTo;
    @Column(name = "status", nullable = false, length = 32) private String status;
    @Column(name = "created_by", nullable = false) private Long createdBy;
    @Column(name = "approved_by") private Long approvedBy;
    @Column(name = "approved_at") private LocalDateTime approvedAt;
    @Column(name = "approval_note", length = 255) private String approvalNote;

    protected CommissionPolicy() { }

    public static CommissionPolicy draft(String code, String platform, String country, String role, int maxLevel,
                                         boolean l1Enabled, BigDecimal l1Rate, Integer l1Freeze,
                                         boolean l2Enabled, BigDecimal l2Rate, Integer l2Freeze,
                                         boolean l3Enabled, BigDecimal l3Rate, Integer l3Freeze,
                                         LocalDateTime effectiveFrom, LocalDateTime effectiveTo, Long createdBy) {
        CommissionPolicy policy = new CommissionPolicy();
        policy.policyCode = code; policy.commissionType = INVITATION; policy.platformCode = platform; policy.countryCode = country; policy.roleCode = role;
        policy.maxRewardLevel = maxLevel; policy.level1Enabled = l1Enabled; policy.level1Rate = l1Rate; policy.level1FreezeDays = l1Freeze;
        policy.level2Enabled = l2Enabled; policy.level2Rate = l2Rate; policy.level2FreezeDays = l2Freeze;
        policy.level3Enabled = l3Enabled; policy.level3Rate = l3Rate; policy.level3FreezeDays = l3Freeze;
        policy.effectiveFrom = effectiveFrom; policy.effectiveTo = effectiveTo; policy.status = DRAFT; policy.createdBy = createdBy;
        return policy;
    }

    public void activate(Long approverId, LocalDateTime at, String note) { status = ACTIVE; approvedBy = approverId; approvedAt = at; approvalNote = note; }
    public void retire() { status = RETIRED; }
    public Long getId() { return id; }
    public String getPolicyCode() { return policyCode; }
    public String getCommissionType() { return commissionType; }
    public String getPlatformCode() { return platformCode; }
    public String getCountryCode() { return countryCode; }
    public String getRoleCode() { return roleCode; }
    public int getMaxRewardLevel() { return maxRewardLevel; }
    public String getStatus() { return status; }
    public LocalDateTime getEffectiveFrom() { return effectiveFrom; }
    public LocalDateTime getEffectiveTo() { return effectiveTo; }
    public Long getCreatedBy() { return createdBy; }
    public Long getApprovedBy() { return approvedBy; }
    public LocalDateTime getApprovedAt() { return approvedAt; }
    public String getApprovalNote() { return approvalNote; }
    public Level level(int level) {
        return switch (level) {
            case 1 -> new Level(level1Enabled, level1Rate, level1FreezeDays);
            case 2 -> new Level(level2Enabled, level2Rate, level2FreezeDays);
            case 3 -> new Level(level3Enabled, level3Rate, level3FreezeDays);
            default -> throw new IllegalArgumentException("reward level must be 1 to 3");
        };
    }
    public record Level(boolean enabled, BigDecimal rate, Integer freezeDays) { }
}
