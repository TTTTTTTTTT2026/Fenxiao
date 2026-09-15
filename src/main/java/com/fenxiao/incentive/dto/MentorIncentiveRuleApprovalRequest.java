package com.fenxiao.incentive.dto;

import jakarta.validation.constraints.NotBlank;

public record MentorIncentiveRuleApprovalRequest(@NotBlank String approvalNote) {
}
