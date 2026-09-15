package com.fenxiao.income.mcn.entity;

import com.fenxiao.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "mcn_income_delivery_receipt")
public class McnIncomeDeliveryReceipt extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "source_system", nullable = false, length = 32)
    private String sourceSystem;

    @Column(name = "delivery_id", nullable = false, length = 128)
    private String deliveryId;

    @Column(name = "platform_code", nullable = false, length = 32)
    private String platformCode;

    @Column(name = "payload_hash", nullable = false, length = 64)
    private String payloadHash;

    /** Stable normalized fact evidence; response snapshot and watermark are intentionally excluded. */
    @Column(name = "fact_evidence_hash", length = 64)
    private String factEvidenceHash;

    @Column(name = "fact_count", nullable = false)
    private int factCount;

    @Column(name = "accepted_at", nullable = false)
    private Instant acceptedAt;

    @Column(name = "snapshot_at")
    private Instant snapshotAt;

    @Lob
    @Column(name = "source_watermark", columnDefinition = "LONGTEXT")
    private String sourceWatermark;

    protected McnIncomeDeliveryReceipt() {
    }

    public static McnIncomeDeliveryReceipt accept(String sourceSystem, String deliveryId, String platformCode,
                                                  String payloadHash, String factEvidenceHash, int factCount, Instant acceptedAt,
                                                  Instant snapshotAt, String sourceWatermark) {
        McnIncomeDeliveryReceipt receipt = new McnIncomeDeliveryReceipt();
        receipt.sourceSystem = sourceSystem;
        receipt.deliveryId = deliveryId;
        receipt.platformCode = platformCode;
        receipt.payloadHash = payloadHash;
        receipt.factEvidenceHash = factEvidenceHash;
        receipt.factCount = factCount;
        receipt.acceptedAt = acceptedAt;
        receipt.snapshotAt = snapshotAt;
        receipt.sourceWatermark = sourceWatermark;
        return receipt;
    }

    public String getPayloadHash() {
        return payloadHash;
    }

    public String getFactEvidenceHash() { return factEvidenceHash; }
    public String getPlatformCode() { return platformCode; }
    public void recordFactEvidenceHash(String value) { this.factEvidenceHash = value; }

    public int getFactCount() {
        return factCount;
    }
}
