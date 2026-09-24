package com.fenxiao.income.mcn.api.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record InvitationRewardAccountResponse(long userId, String unit, BigDecimal frozenPoints,
        BigDecimal availablePoints, BigDecimal totalPoints, BigDecimal cumulativeIncomePoints,
        BigDecimal directIncomePoints, BigDecimal indirectIncomePoints,
        boolean withdrawalEnabled, long totalRecords, int page, int size, List<Flow> items) {
    public record Flow(long id, String type, BigDecimal frozenDelta, BigDecimal availableDelta,
            String reason, Instant recordedAt, String platformCode, String sourceEventId,
            int rewardLevel, long sourceUserId, BigDecimal rawDiamonds,
            BigDecimal companyShareRate, BigDecimal companyIncomeDiamonds,
            BigDecimal invitationRate, BigDecimal rewardDiamonds,
            BigDecimal pointsPerDiamond, long conversionId) { }
}
