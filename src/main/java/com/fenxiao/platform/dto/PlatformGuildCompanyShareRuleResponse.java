package com.fenxiao.platform.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Versioned company-income share rule. Drafts are never used in calculations. */
public record PlatformGuildCompanyShareRuleResponse(
        long id, String platformCode, String guildId, int shareVersion, BigDecimal shareRate,
        LocalDateTime effectiveFrom, LocalDateTime effectiveTo, String status,
        Long createdBy, Long approvedBy, LocalDateTime approvedAt, String approvalNote) { }
