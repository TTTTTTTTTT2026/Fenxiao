package com.fenxiao.income.mcn.external;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/** Regression test for MCN's published, non-production HMAC acceptance vector. */
class McnIncomeFactsRequestSignerTest {
    @Test
    void shouldReproduceThePublishedChangesAcceptanceVector() {
        McnIncomeFactsRequestSigner signer = new McnIncomeFactsRequestSigner();
        String rawBody = "{\"platformCode\":\"TIMO\",\"cursor\":null,\"pageSize\":2}";

        assertThat(signer.sha256(rawBody))
                .isEqualTo("354559b2d6360e048f2dc7b516579df7d103fc49872366d3a926aed71b85bfe9");
        assertThat(signer.sign("mcn-income-v1-test-secret-00000000000000000001", "POST",
                "/api/external/income-facts/v1/changes/query", "income_facts.read", 1789132800L,
                "test-nonce-0001", "11111111-2222-4333-8444-555555555555", rawBody))
                .isEqualTo("fa8b65637918199c8bbaeb6c154d56f0bbbc4d33b50cba561b62c8e917a0133c");
    }
}
