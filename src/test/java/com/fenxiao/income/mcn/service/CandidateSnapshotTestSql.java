package com.fenxiao.income.mcn.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

/** H2-only equivalent of the existing MySQL audit-sampling function. Production SQL remains unchanged. */
public final class CandidateSnapshotTestSql {
    private CandidateSnapshotTestSql() { }
    public static String sha2(String value,int bits) throws Exception {
        if (bits!=256) throw new IllegalArgumentException("test supports SHA-256 only");
        return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
    }
}
