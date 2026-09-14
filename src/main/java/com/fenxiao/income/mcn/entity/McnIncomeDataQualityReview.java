package com.fenxiao.income.mcn.entity;

import com.fenxiao.common.entity.BaseEntity;
import jakarta.persistence.*;

import java.time.Instant;

/**
 * An operator conclusion for one immutable MCN fact revision. A newer MCN revision deliberately
 * starts a new review instead of inheriting the old conclusion.
 */
@Entity
@Table(name = "mcn_income_data_quality_review", uniqueConstraints = @UniqueConstraint(
        name = "uk_mcn_income_quality_review_revision",
        columnNames = {"source_system", "platform_code", "source_event_id", "source_revision"}))
public class McnIncomeDataQualityReview extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "source_system", nullable = false, length = 32) private String sourceSystem;
    @Column(name = "platform_code", nullable = false, length = 32) private String platformCode;
    @Column(name = "source_event_id", nullable = false, length = 128) private String sourceEventId;
    @Column(name = "source_revision", nullable = false, length = 512) private String sourceRevision;
    @Column(name = "review_status", nullable = false, length = 32) private String reviewStatus;
    @Column(name = "review_note", nullable = false, length = 255) private String reviewNote;
    @Column(name = "reviewed_by", nullable = false) private Long reviewedBy;
    @Column(name = "reviewed_role", nullable = false, length = 32) private String reviewedRole;
    @Column(name = "reviewed_at", nullable = false) private Instant reviewedAt;

    protected McnIncomeDataQualityReview() { }

    public static McnIncomeDataQualityReview create(String sourceSystem, String platformCode, String sourceEventId,
                                                     String sourceRevision, String reviewStatus, String reviewNote,
                                                     Long reviewedBy, String reviewedRole, Instant reviewedAt) {
        McnIncomeDataQualityReview item = new McnIncomeDataQualityReview();
        item.sourceSystem = sourceSystem; item.platformCode = platformCode; item.sourceEventId = sourceEventId;
        item.sourceRevision = sourceRevision; item.reviewStatus = reviewStatus; item.reviewNote = reviewNote;
        item.reviewedBy = reviewedBy; item.reviewedRole = reviewedRole; item.reviewedAt = reviewedAt;
        return item;
    }

    public Long getId() { return id; }
    public String getReviewStatus() { return reviewStatus; }
    public String getReviewNote() { return reviewNote; }
    public Long getReviewedBy() { return reviewedBy; }
    public Instant getReviewedAt() { return reviewedAt; }
    public void update(String reviewStatus, String reviewNote, Long reviewedBy, String reviewedRole, Instant reviewedAt) {
        this.reviewStatus = reviewStatus; this.reviewNote = reviewNote; this.reviewedBy = reviewedBy;
        this.reviewedRole = reviewedRole; this.reviewedAt = reviewedAt;
    }
}
