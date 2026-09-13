package com.fenxiao.income.mcn.external;

import java.math.BigDecimal;
import java.time.LocalDate;

/** MCN's latest-revision aggregate. It is used only for shadow-ledger comparison. */
public record McnIncomeFactsReconciliationGroup(LocalDate businessDate, String guildId,
                                                String settlementStatus, String amountUnit,
                                                String currencyCode, int factCount,
                                                BigDecimal absoluteAmountTotal, String projectionChecksum) {
}
