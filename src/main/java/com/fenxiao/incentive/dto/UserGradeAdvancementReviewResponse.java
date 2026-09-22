package com.fenxiao.incentive.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** Read model for the automated 30-day Platinum observation. */
public record UserGradeAdvancementReviewResponse(
        long id, long userId, String platformCode, String guildId, String targetGradeCode,
        LocalDate observationStart, LocalDate observationEnd,
        int eligibleSilverMemberCount, int passedSilverMemberCount, int requiredSilverMemberCount,
        String reviewStatus, Long promotionConfirmedBy, LocalDateTime promotionConfirmedAt,
        String promotionNote, String failureNote, Long createdBy, LocalDateTime createdAt, LocalDateTime updatedAt,
        List<UserGradePlatinumObservationProgressResponse> progress) { }
