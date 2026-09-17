package com.fenxiao.incentive.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record OperatingDividendProfitFactResponse(
        long id, long teamId, String platformCode, LocalDate periodStart, LocalDate periodEnd,
        long operatingProfitMinor, String currencyCode, String sourceSystem, String sourceEventId,
        LocalDateTime receivedAt) {
}
