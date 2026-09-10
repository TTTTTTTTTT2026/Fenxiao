package com.fenxiao.platform.mcn;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class McnTimoRequestSignerTest {
    @Test
    void shouldMatchTheMcnProvidedHmacAcceptanceVector() {
        McnTimoRequestSigner signer = new McnTimoRequestSigner(new ObjectMapper());
        McnTimoBatchQuery body = new McnTimoBatchQuery("TIMO", "CURRENT_THEN_LIVE", List.of(
                new McnTimoBatchQuery.Subject("999999999999", "22000408", "Mexico")));

        McnTimoRequestSigner.SignedRequest signed = signer.sign(body,
                "bandeira-test-credential", "bandeira-mcn-phase1-test-secret-2026-only", 1700000000L,
                "bandeira-test-nonce-0001", "018bdc4e-5b12-7a4f-9c01-000000000001");

        assertThat(signed.rawBody()).isEqualTo("{\"platform\":\"TIMO\",\"lookupMode\":\"CURRENT_THEN_LIVE\",\"subjects\":[{\"subjectId\":\"999999999999\",\"expectedGuildId\":\"22000408\",\"expectedCountry\":\"Mexico\"}]}");
        assertThat(signed.bodyHash()).isEqualTo("66864e669b67875108e703d2158bb56ab1e32148e794631788606ff675d14105");
        assertThat(signed.canonical()).isEqualTo("POST\n/api/external/timo/v2/joined-guild-at/batch-query\ntimo.joined_guild_at.read\n1700000000\nbandeira-test-nonce-0001\n018bdc4e-5b12-7a4f-9c01-000000000001\n66864e669b67875108e703d2158bb56ab1e32148e794631788606ff675d14105");
        assertThat(signed.signature()).isEqualTo("4a3af39c3b7b3be9c3655915987c0f3e81dcdac0052af2b2f0c9e7d5ff6ec424");
    }
}
