package com.fenxiao.distribution.service;

import com.fenxiao.common.api.ServiceUnavailableException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

@ActiveProfiles("test")
@SpringBootTest(properties = "app.distribution.real-finance.enabled=false")
class RealFinanceGateIntegrationTest {

    @Autowired WithdrawRequestService withdrawals;

    @Test
    void blocksWithdrawalCreationBeforeAnyFinancialStateIsReadOrWritten() {
        assertThatThrownBy(() -> withdrawals.createRequest(1L))
                .isInstanceOf(ServiceUnavailableException.class)
                .hasMessageContaining("real finance operations are disabled");
    }
}
