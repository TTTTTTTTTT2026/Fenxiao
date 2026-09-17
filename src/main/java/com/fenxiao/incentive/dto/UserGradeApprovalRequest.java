package com.fenxiao.incentive.dto;

import jakarta.validation.constraints.NotBlank;

public record UserGradeApprovalRequest(@NotBlank String approvalNote) {
}
