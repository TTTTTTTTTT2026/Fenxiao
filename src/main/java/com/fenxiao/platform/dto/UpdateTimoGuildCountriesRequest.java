package com.fenxiao.platform.dto;

import jakarta.validation.constraints.*;
import java.util.List;

public record UpdateTimoGuildCountriesRequest(@NotNull @Min(0) Integer expectedVersion,
                                             @NotNull @Size(max = 7) List<@NotBlank String> countryCodes) {}
