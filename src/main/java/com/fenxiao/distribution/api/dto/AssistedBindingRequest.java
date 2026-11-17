package com.fenxiao.distribution.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record AssistedBindingRequest(
        @NotBlank @Pattern(regexp = "TIMO|LINKY") String platformCode,
        @NotBlank @Pattern(regexp = "[0-9]{8}|[1-9][0-9]{11}") String platformUserId) {}
