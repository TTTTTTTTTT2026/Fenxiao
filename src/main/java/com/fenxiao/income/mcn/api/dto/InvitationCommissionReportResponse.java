package com.fenxiao.income.mcn.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record InvitationCommissionReportResponse(String platformCode, LocalDate startDate, LocalDate endDate,
        BigDecimal directPoints, BigDecimal indirectPoints, BigDecimal totalPoints,
        BigDecimal unattributedPoints, int page, int size, boolean hasMore, List<Invitee> items) {
    public record Invitee(long userId, String nickname, BigDecimal directPoints,
            BigDecimal indirectPoints, BigDecimal totalPoints) { }
}
