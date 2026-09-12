package com.fenxiao.income.mcn.dto;

public record McnIncomeDeliveryResponse(
        String deliveryId,
        String deliveryStatus,
        int receivedFactCount,
        int newFactCount,
        int duplicateFactCount,
        int unmatchedFactCount
) {
}
