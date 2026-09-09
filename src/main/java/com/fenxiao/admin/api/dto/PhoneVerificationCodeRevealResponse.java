package com.fenxiao.admin.api.dto;

import java.time.LocalDateTime;

public record PhoneVerificationCodeRevealResponse(Long id, String verificationCode, String status, LocalDateTime expiresAt) {}
