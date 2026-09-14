package com.fenxiao.rule.api.dto;

import jakarta.validation.constraints.NotBlank;
public record CommissionPolicyActivationRequest(@NotBlank String approvalNote) { }
