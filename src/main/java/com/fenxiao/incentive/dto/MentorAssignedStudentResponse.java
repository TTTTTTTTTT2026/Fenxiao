package com.fenxiao.incentive.dto;

import java.time.LocalDateTime;

/** Read-only current student assignment shown while an operator edits a mentor's student list. */
public record MentorAssignedStudentResponse(
        long userId,
        String phoneNumber,
        String countryCode,
        String languageCode,
        LocalDateTime assignedAt,
        String assignmentReason) {
}
