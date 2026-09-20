package com.fenxiao.incentive.dto;

import java.time.LocalDateTime;
import java.util.List;

/** Audit record for advanced-grade training, operating validation, and leadership responsibility. */
public record UserGradeAdvancementReviewResponse(
        long id, long userId, String platformCode, String guildId, String targetGradeCode,
        String trainingStatus, String trainingNote, Long trainingVerifiedBy, LocalDateTime trainingVerifiedAt,
        String operatingValidationStatus, String operatingValidationNote, Long operatingVerifiedBy, LocalDateTime operatingVerifiedAt,
        String responsibilityStatus, String responsibilityNote, Long responsibilityConfirmedBy, LocalDateTime responsibilityConfirmedAt,
        String reviewStatus, Long createdBy, LocalDateTime createdAt, LocalDateTime updatedAt,
        List<UserGradePlatinumEvidenceResponse> platinumEvidence,
        List<UserGradeAdvancedEvidenceResponse> advancedEvidence) { }
