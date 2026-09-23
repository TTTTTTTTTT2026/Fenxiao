package com.fenxiao.income.mcn.external;

import java.time.LocalDate;
import java.util.List;

public record McnIncomeFactsReconciliationQuery(String platformCode, List<String> platformUserIds,
                                                 LocalDate businessDateFrom, LocalDate businessDateTo,
                                                 List<String> guildIds) {
    /** Empty account scope is explicit and fail-closed; it never means platform-wide. */
    public McnIncomeFactsReconciliationQuery(String platformCode, LocalDate businessDateFrom,
                                             LocalDate businessDateTo, List<String> guildIds) {
        this(platformCode, List.of(), businessDateFrom, businessDateTo, guildIds);
    }
}
