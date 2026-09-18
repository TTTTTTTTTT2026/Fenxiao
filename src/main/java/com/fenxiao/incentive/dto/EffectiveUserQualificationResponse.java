package com.fenxiao.incentive.dto;

import java.time.LocalDateTime;

/** Evidence-backed effective-user result for one user and platform; never a reward or balance record. */
public record EffectiveUserQualificationResponse(long userId, String platformCode, String qualificationStatus,
                                                 LocalDateTime firstIncomeAt, LocalDateTime observationEndsAt,
                                                 int qualifyingIncomeDateCount, String qualifyingIncomeDates,
                                                 LocalDateTime latestIncomeAt, String sourceEvidenceSnapshot,
                                                 LocalDateTime qualifiedAt, LocalDateTime evidenceRevokedAt,
                                                 String manualCorrectionReason, String manualCorrectionNote,
                                                 Long correctedBy, LocalDateTime correctedAt,
                                                 LocalDateTime evaluatedAt) { }
