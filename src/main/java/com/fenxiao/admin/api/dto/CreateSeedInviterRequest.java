package com.fenxiao.admin.api.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateSeedInviterRequest(
        @NotBlank String phoneNumber,
        @NotBlank String countryCode,
        @NotBlank String languageCode) {
}
