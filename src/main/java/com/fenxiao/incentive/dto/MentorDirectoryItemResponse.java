package com.fenxiao.incentive.dto;

/** Read-only mentor directory item for operations. Student count reflects current assignments only. */
public record MentorDirectoryItemResponse(
        long userId,
        String phoneNumber,
        String countryCode,
        String languageCode,
        String qualificationStatus,
        int maxActiveStudents,
        long assignedStudentCount) {
}
