package com.fenxiao.distribution.api.dto;

import com.fenxiao.distribution.entity.LinkyAccountBinding;

public record LinkyAccountBindingResponse(
        Long userId,
        String linkyAccount,
        String status,
        String verifiedAt
) {
    public static LinkyAccountBindingResponse verified(LinkyAccountBinding binding) {
        return new LinkyAccountBindingResponse(
                binding.getUserId(),
                binding.getLinkyAccount(),
                "VERIFIED",
                binding.getCheckedAt() == null ? null : binding.getCheckedAt().toString()
        );
    }
}
