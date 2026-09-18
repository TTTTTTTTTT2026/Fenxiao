package com.fenxiao.platform.dto;

import jakarta.validation.constraints.NotBlank;

public record PlatformGuildCompanyShareRuleApprovalRequest(@NotBlank String approvalNote) { }
