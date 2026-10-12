package com.fenxiao.distribution.api.dto;

import java.time.LocalDateTime;

public record ConsumerGradeProgressResponse(String platformCode, String state, String currentGradeCode,
                                           Integer qualifiedDirectInviteCount, Integer requiredDirectInviteCount,
                                           LocalDateTime gradeEvaluatedAt) { }
