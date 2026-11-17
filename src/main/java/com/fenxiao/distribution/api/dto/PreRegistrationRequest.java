package com.fenxiao.distribution.api.dto;

import jakarta.validation.constraints.*;

public record PreRegistrationRequest(@NotBlank String countryCode, @NotBlank String phoneNumber,
                                     @Pattern(regexp="TIMO|LINKY") @NotBlank String platformCode,
                                     @NotBlank String platformUserId, Long revision) {}
