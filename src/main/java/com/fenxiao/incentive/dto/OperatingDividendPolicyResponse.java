package com.fenxiao.incentive.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record OperatingDividendPolicyResponse(
        long id, String policyCode, int policyVersion,
        String platformCode, String countryCode, String guildId,
        int requiredValidStarts, int requiredWithdrawEligible, int requiredActive7d,
        BigDecimal profitShareRate, LocalDateTime effectiveFrom, LocalDateTime effectiveTo,
        String status, Long createdBy, Long approvedBy, LocalDateTime approvedAt, String approvalNote) {
}
