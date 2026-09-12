package com.fenxiao.income.mcn.entity;

import com.fenxiao.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

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

    @Column(name = "payload_hash", nullable = false, length = 64)
    private String payloadHash;

    @Column(name = "fact_count", nullable = false)
    private int factCount;

    @Column(name = "accepted_at", nullable = false)
    private LocalDateTime acceptedAt;

    protected McnIncomeDeliveryReceipt() {
    }

    public static McnIncomeDeliveryReceipt accept(String sourceSystem, String deliveryId, String payloadHash,
                                                  int factCount, LocalDateTime acceptedAt) {
        McnIncomeDeliveryReceipt receipt = new McnIncomeDeliveryReceipt();
        receipt.sourceSystem = sourceSystem;
        receipt.deliveryId = deliveryId;
        receipt.payloadHash = payloadHash;
        receipt.factCount = factCount;
        receipt.acceptedAt = acceptedAt;
        return receipt;
    }

    public String getPayloadHash() {
        return payloadHash;
    }

    public int getFactCount() {
        return factCount;
    }
}
