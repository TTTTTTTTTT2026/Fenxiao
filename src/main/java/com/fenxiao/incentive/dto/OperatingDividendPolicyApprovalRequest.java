package com.fenxiao.incentive.dto;

import jakarta.validation.constraints.NotBlank;

public record OperatingDividendPolicyApprovalRequest(@NotBlank String approvalNote) {
}
