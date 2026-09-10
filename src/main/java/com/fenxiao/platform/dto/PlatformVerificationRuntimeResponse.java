package com.fenxiao.platform.dto;

public record PlatformVerificationRuntimeResponse(
        String source,
        boolean mockManagementEnabled,
        String explanation) {
}
