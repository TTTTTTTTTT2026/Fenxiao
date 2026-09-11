package com.fenxiao.platform.mcn;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class McnLinkyRequestSignerTest {
    @Test
    void shouldSignTheExactV1LinkyRequestBodyWithoutCountryOrLookupMode() {
        McnLinkyRequestSigner signer = new McnLinkyRequestSigner(new ObjectMapper());
        McnLinkyRequestSigner.SignedRequest signed = signer.sign(
                new McnLinkyBatchQuery("LINKY", List.of(new McnLinkyBatchQuery.Subject("12345678", "39694876"))),
                "bandeira-linky-v1-test", "test-secret", 1700000000L,
                "bandeira-linky-nonce-0001", "018bdc4e-5b12-7a4f-9c01-000000000001");

        assertThat(signed.rawBody()).isEqualTo("{\"platform\":\"LINKY\",\"subjects\":[{\"subjectId\":\"12345678\",\"expectedGuildId\":\"39694876\"}]}");
        assertThat(signed.canonical()).startsWith("POST\n/api/external/linky/v1/guild-membership/batch-query\nlinky.guild_membership.read\n");
        assertThat(signed.canonical()).endsWith("\n" + signed.bodyHash());
        assertThat(signed.signature()).hasSize(64);
    }
}
