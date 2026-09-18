package com.fenxiao.incentive.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** One trainee and its independently reviewed 30-day group-operation evidence. */
public record UserGradePlatinumEvidenceResponse(
        long id, long traineeUserId, String groupReference,
        LocalDate observationStart, LocalDate observationEnd,
        int finalWeekEffectiveUserCount, int finalWeekMinIncomeDateCount,
        String evidenceNote, String evidenceStatus,
        Long recordedBy, LocalDateTime recordedAt, Long confirmedBy, LocalDateTime confirmedAt) { }
