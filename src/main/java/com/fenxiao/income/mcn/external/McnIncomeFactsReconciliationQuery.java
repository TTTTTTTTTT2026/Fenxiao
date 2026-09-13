package com.fenxiao.income.mcn.external;

import java.time.LocalDate;
import java.util.List;

public record McnIncomeFactsReconciliationQuery(String platformCode, LocalDate businessDateFrom,
                                                 LocalDate businessDateTo, List<String> guildIds) {
}
