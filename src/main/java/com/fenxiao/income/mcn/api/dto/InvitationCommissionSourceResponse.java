package com.fenxiao.income.mcn.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record InvitationCommissionSourceResponse(String platformCode, LocalDate startDate, LocalDate endDate,
        long directInviteeUserId, String directInviteeNickname, BigDecimal indirectPoints,
        int page, int size, boolean hasMore, List<Source> items) {
    public record Source(long userId, String nickname, BigDecimal points) { }
}
