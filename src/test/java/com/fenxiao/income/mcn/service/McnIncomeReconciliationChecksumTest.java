package com.fenxiao.income.mcn.service;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class McnIncomeReconciliationChecksumTest {
    @Test
    void matchesMcnV2PublishedVectorAndSortsEvents() {
        assertThat(McnIncomeReconciliationChecksum.ofLines(List.of(
                new McnIncomeReconciliationChecksum.Line("evt-b", "rev-2", new BigDecimal("0.00")),
                new McnIncomeReconciliationChecksum.Line("evt-a", "rev-1", new BigDecimal("12.500")))))
                .isEqualTo("1653cd77ea27846fb1249e1542e088c68cc2d8c45eb68544fdb2fd7e1a6da40e");
    }
}
