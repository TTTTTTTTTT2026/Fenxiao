package com.fenxiao.admin.api.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateUserCountryRequest(@NotBlank String countryCode) {}
