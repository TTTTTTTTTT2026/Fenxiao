package com.fenxiao.income.mcn.external;

import java.time.LocalDate;
import java.util.List;

public record McnIncomeFactsQuery(String platformCode, List<String> platformUserIds, String cursor, int pageSize,
                                  LocalDate businessDateFrom, LocalDate businessDateTo) {
    /** Empty account scope is explicit and fail-closed; it never means platform-wide. */
    public McnIncomeFactsQuery(String platformCode, String cursor, int pageSize,
                               LocalDate businessDateFrom, LocalDate businessDateTo) {
        this(platformCode, List.of(), cursor, pageSize, businessDateFrom, businessDateTo);
    }
}
