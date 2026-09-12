package com.fenxiao.income.mcn.entity;

import com.fenxiao.common.entity.BaseEntity;
import com.fenxiao.income.mcn.domain.McnIncomeEventType;
import com.fenxiao.income.mcn.domain.McnIncomeResolutionStatus;
import com.fenxiao.income.mcn.domain.McnIncomeSettlementStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Append-only evidence received from MCN. No reward, wallet or withdrawal state is represented here.
 */
@Entity
@Table(name = "mcn_income_raw_ledger_event")
public class McnIncomeRawLedgerEvent extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "source_system", nullable = false, length = 32)
    private String sourceSystem;

    @Column(name = "delivery_id", nullable = false, length = 128)
    private String deliveryId;

    @Column(name = "platform_code", nullable = false, length = 32)
    private String platformCode;

    @Column(name = "fact_granularity", nullable = false, length = 32)
    private String factGranularity;

    @Column(name = "source_event_id", nullable = false, length = 128)
    private String sourceEventId;

    @Column(name = "source_revision", nullable = false, length = 64)
    private String sourceRevision;

    @Column(name = "original_source_event_id", length = 128)
    private String originalSourceEventId;

    @Column(name = "platform_user_id", nullable = false, length = 64)
    private String platformUserId;

    @Column(name = "resolved_user_id")
    private Long resolvedUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "resolution_status", nullable = false, length = 32)
    private McnIncomeResolutionStatus resolutionStatus;

    @Column(name = "resolution_reason", nullable = false, length = 96)
    private String resolutionReason;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 32)
    private McnIncomeEventType eventType;

    @Enumerated(EnumType.STRING)
    @Column(name = "settlement_status", nullable = false, length = 32)
    private McnIncomeSettlementStatus settlementStatus;

    @Column(name = "settlement_basis", length = 64)
    private String settlementBasis;

    @Column(name = "amount", nullable = false, precision = 18, scale = 6)
    private BigDecimal amount;

    @Column(name = "currency_code", nullable = false, length = 16)
    private String currencyCode;

    @Column(name = "amount_unit", nullable = false, length = 32)
    private String amountUnit;

    @Column(name = "business_date", nullable = false)
    private LocalDate businessDate;

    @Column(name = "source_timezone", nullable = false, length = 64)
    private String sourceTimezone;

    @Column(name = "period_start", nullable = false)
    private Instant periodStart;

    @Column(name = "period_end", nullable = false)
    private Instant periodEnd;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;

    @Column(name = "settled_at")
    private Instant settledAt;

    @Column(name = "source_updated_at", nullable = false)
    private Instant sourceUpdatedAt;

    @Column(name = "guild_id", length = 64)
    private String guildId;

    @Column(name = "payload_hash", nullable = false, length = 64)
    private String payloadHash;

    @Lob
    @Column(name = "source_payload", nullable = false, columnDefinition = "LONGTEXT")
    private String sourcePayload;

    @Column(name = "received_at", nullable = false)
    private Instant receivedAt;

    protected McnIncomeRawLedgerEvent() {
    }

    public static McnIncomeRawLedgerEvent record(String sourceSystem, String deliveryId, String platformCode,
                                                   String factGranularity,
                                                   String sourceEventId, String sourceRevision,
                                                   String originalSourceEventId, String platformUserId,
                                                   Long resolvedUserId, McnIncomeResolutionStatus resolutionStatus,
                                                   String resolutionReason, McnIncomeEventType eventType,
                                                   McnIncomeSettlementStatus settlementStatus, BigDecimal amount,
                                                   String currencyCode, String amountUnit, LocalDate businessDate,
                                                   String sourceTimezone, Instant periodStart, Instant periodEnd,
                                                   Instant occurredAt, Instant settledAt, Instant sourceUpdatedAt,
                                                   String guildId, String payloadHash, String sourcePayload,
                                                   Instant receivedAt, String settlementBasis) {
        McnIncomeRawLedgerEvent event = new McnIncomeRawLedgerEvent();
        event.sourceSystem = sourceSystem;
        event.deliveryId = deliveryId;
        event.platformCode = platformCode;
        event.factGranularity = factGranularity;
        event.sourceEventId = sourceEventId;
        event.sourceRevision = sourceRevision;
        event.originalSourceEventId = originalSourceEventId;
        event.platformUserId = platformUserId;
        event.resolvedUserId = resolvedUserId;
        event.resolutionStatus = resolutionStatus;
        event.resolutionReason = resolutionReason;
        event.eventType = eventType;
        event.settlementStatus = settlementStatus;
        event.settlementBasis = settlementBasis;
        event.amount = amount;
        event.currencyCode = currencyCode;
        event.amountUnit = amountUnit;
        event.businessDate = businessDate;
        event.sourceTimezone = sourceTimezone;
        event.periodStart = periodStart;
        event.periodEnd = periodEnd;
        event.occurredAt = occurredAt;
        event.settledAt = settledAt;
        event.sourceUpdatedAt = sourceUpdatedAt;
        event.guildId = guildId;
        event.payloadHash = payloadHash;
        event.sourcePayload = sourcePayload;
        event.receivedAt = receivedAt;
        return event;
    }

    public Long getId() { return id; }
    public String getSourceEventId() { return sourceEventId; }
    public String getSourceRevision() { return sourceRevision; }
    public String getPlatformCode() { return platformCode; }
    public String getFactGranularity() { return factGranularity; }
    public String getPlatformUserId() { return platformUserId; }
    public Long getResolvedUserId() { return resolvedUserId; }
    public McnIncomeResolutionStatus getResolutionStatus() { return resolutionStatus; }
    public String getPayloadHash() { return payloadHash; }
}
