package com.fenxiao.income.mcn.service;

import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import static org.assertj.core.api.Assertions.*;

class CandidateSnapshotFingerprintTest {
    private String hash(Object... values) { var value=new CandidateSnapshotFingerprint(true);value.row(values);return value.finish(); }
    @Test void typedLengthFramingSeparatesNullEmptyStringsAndDelimiters() {
        assertThat(hash((Object)null)).isNotEqualTo(hash(""));
        assertThat(hash("a:b","c")).isNotEqualTo(hash("a","b:c"));
        assertThat(hash(1)).isNotEqualTo(hash("1"));
        assertThat(hash("é")).isNotEqualTo(hash("e"));
        assertThat(hash(new BigDecimal("1.00"))).isEqualTo(hash(new BigDecimal("1.000000")));
        assertThat(hash(new BigDecimal("0.000"))).isEqualTo(hash(BigDecimal.ZERO));
    }

    @Test void immutableCompressedDependenciesCanBeRecoveredWithoutDuplicatingResultRows() throws Exception {
        var evidence=new CandidateSnapshotFingerprint(true);evidence.row("binding","synthetic-account",java.time.Instant.EPOCH);
        byte[] bytes=evidence.sealDependencies();
        try(var input=new java.util.zip.GZIPInputStream(new java.io.ByteArrayInputStream(bytes))) {
            assertThat(new String(input.readAllBytes(),java.nio.charset.StandardCharsets.UTF_8)).contains("binding","synthetic-account");
        }
        evidence.row("item","result-only");
        assertThat(evidence.sealDependencies()).isEqualTo(bytes);
        assertThat(evidence.finish()).hasSize(64);
    }
}
