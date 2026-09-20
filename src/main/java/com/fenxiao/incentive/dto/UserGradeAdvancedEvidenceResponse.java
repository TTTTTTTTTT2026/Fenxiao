package com.fenxiao.incentive.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** One independently auditable Diamond/Black Gold cultivation and operating-scope record. */
public record UserGradeAdvancedEvidenceResponse(
        long id, long traineeUserId, String scopeReference,
        LocalDate observationStart, LocalDate observationEnd,
        String evidenceNote, String evidenceStatus,
        Long recordedBy, LocalDateTime recordedAt, Long confirmedBy, LocalDateTime confirmedAt) { }
