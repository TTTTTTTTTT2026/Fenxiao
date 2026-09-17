package com.fenxiao.incentive.dto;

import jakarta.validation.constraints.NotNull;

/** Explicit operations authorization; it is independent of automatic team-leader qualification. */
public record TeamOperatingProfitSharePermissionRequest(@NotNull Boolean enabled) {
}
