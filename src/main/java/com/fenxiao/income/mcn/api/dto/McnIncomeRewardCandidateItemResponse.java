package com.fenxiao.income.mcn.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Finance-only candidate evidence. Platform account identifiers and raw payloads are never exposed. */
public record McnIncomeRewardCandidateItemResponse(String sourceEventReference, LocalDate businessDate,
                                                    Long sourceUserId, Long recipientUserId, int rewardLevel,
                                                    String status, String reason, BigDecimal baseAmount,
                                                    BigDecimal candidateAmount, String amountUnit) { }
