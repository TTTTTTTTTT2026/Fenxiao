package com.fenxiao.income.mcn.external;

import java.time.LocalDate;

public record McnIncomeFactsQuery(String platformCode, String cursor, int pageSize,
                                  LocalDate businessDateFrom, LocalDate businessDateTo) {
}
