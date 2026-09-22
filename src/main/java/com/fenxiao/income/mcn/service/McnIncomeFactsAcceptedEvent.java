package com.fenxiao.income.mcn.service;

import java.time.LocalDate;
import java.util.Set;

/**
 * Published only after a FINAL MCN page has been accepted by the immutable raw ledger.
 * It deliberately contains no reward, wallet or payment instruction.
 */
public record McnIncomeFactsAcceptedEvent(String platformCode, Set<LocalDate> businessDates) {
    public McnIncomeFactsAcceptedEvent {
        businessDates = businessDates == null ? Set.of() : Set.copyOf(businessDates);
    }
}
