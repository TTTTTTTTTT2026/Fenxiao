package com.fenxiao.incentive.dto;

import java.time.LocalDate;

/** One directly cultivated Silver member's automatically calculated final-week progress. */
public record UserGradePlatinumObservationProgressResponse(
        long silverUserId, LocalDate windowStart, LocalDate windowEnd,
        int effectiveDirectInviteeCount, boolean passed) { }
