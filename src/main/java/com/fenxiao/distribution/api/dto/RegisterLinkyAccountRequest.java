package com.fenxiao.distribution.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record RegisterLinkyAccountRequest(
        @NotBlank String productCode,
        @NotBlank
        @Pattern(regexp = "^[0-9]{8}$", message = "linky account must be 8 digits")
        String linkyAccount
) {
}
