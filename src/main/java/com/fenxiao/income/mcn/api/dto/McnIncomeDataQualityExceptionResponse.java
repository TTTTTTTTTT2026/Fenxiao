package com.fenxiao.income.mcn.api.dto;

import java.time.Instant;
import java.time.LocalDate;

/** An opaque reference for an operational exception; no platform account or amount is returned. */
public record McnIncomeDataQualityExceptionResponse(String sourceEventReference, LocalDate businessDate,
                                                    String guildId, String status, String settlementStatus,
                                                    String eventType, String sourceRevision,
                                                    Instant sourceUpdatedAt, String reviewStatus,
                                                    String reviewNote, Long reviewedBy, Instant reviewedAt) { }
