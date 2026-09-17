package com.fenxiao.incentive.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TokenPointConversionResponse(
        Long id,
        String platformCode,
        String tokenUnit,
        BigDecimal pointsPerToken,
        boolean configured,
        LocalDateTime updatedAt) {
}
