package com.fenxiao.incentive.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TokenPointConversionResponse(
        long id,
        String conversionCode,
        int conversionVersion,
        String platformCode,
        String tokenUnit,
        BigDecimal pointsPerToken,
        LocalDateTime effectiveFrom,
        LocalDateTime effectiveTo,
        String status,
        Long createdBy,
        Long approvedBy,
        LocalDateTime approvedAt,
        String approvalNote) {
}
