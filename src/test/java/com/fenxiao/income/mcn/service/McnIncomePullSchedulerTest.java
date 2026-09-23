package com.fenxiao.income.mcn.service;

import com.fenxiao.income.mcn.external.McnIncomeFactsProperties;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class McnIncomePullSchedulerTest {
    @Test
    void enablesTheScheduledReaderOnlyWithTheDedicatedConfiguredV2Credential() {
        McnIncomeFactsProperties properties = new McnIncomeFactsProperties();
        properties.setEnabled(true);
        properties.setBaseUrl("https://mcn.example.test");
        properties.setCredentialId("credential");
        properties.setHmacSecret("secret");
        McnIncomePullService pullService = mock(McnIncomePullService.class);

        new McnIncomePullScheduler(properties, pullService).pullIncrementalFacts();

        assertThat(properties.isRegisteredUserScopedPullEnabled()).isTrue();
        verify(pullService).pullAvailablePages("TIMO");
        verify(pullService).pullAvailablePages("LINKY");
    }
}
