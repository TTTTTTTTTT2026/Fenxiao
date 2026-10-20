package com.fenxiao.income.mcn.service;

import java.math.BigDecimal;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.temporal.TemporalAccessor;
import java.util.HexFormat;
import java.util.zip.GZIPOutputStream;

/** Typed, length-prefixed UTF-8 encoding; NULL, empty, delimiters and numeric scales are unambiguous. */
final class CandidateSnapshotFingerprint implements AutoCloseable {
    static final String FORMAT = "CANDIDATE_EVIDENCE_V1";
    private final MessageDigest digest;
    private final ByteArrayOutputStream dependencyBytes;
    private GZIPOutputStream dependencyWriter;

    CandidateSnapshotFingerprint(boolean enabled) {
        try { digest = enabled ? MessageDigest.getInstance("SHA-256") : null; }
        catch (NoSuchAlgorithmException exception) { throw new IllegalStateException(exception); }
        dependencyBytes = enabled ? new ByteArrayOutputStream() : null;
        try { dependencyWriter = enabled ? new GZIPOutputStream(dependencyBytes) : null; }
        catch (IOException exception) { throw new IllegalStateException(exception); }
        row(FORMAT);
    }

    void row(Object... values) {
        if (digest == null) return;
        append(ByteBuffer.allocate(4).putInt(values.length).array());
        for (Object value : values) {
            if (value == null) { append(new byte[]{0}); continue; }
            String text;
            byte type;
            if (value instanceof BigDecimal decimal) { type = 1; text = decimal.stripTrailingZeros().toPlainString(); }
            else if (value instanceof Number) { type = 2; text = value.toString(); }
            else if (value instanceof Boolean) { type = 3; text = value.toString(); }
            else if (value instanceof TemporalAccessor) { type = 4; text = value.toString(); }
            else if (value instanceof String || value instanceof Enum<?>) { type = 5; text = value.toString(); }
            else throw new IllegalArgumentException("unsupported snapshot evidence type: " + value.getClass().getName());
            byte[] bytes = text.getBytes(StandardCharsets.UTF_8);
            append(new byte[]{type});
            append(ByteBuffer.allocate(4).putInt(bytes.length).array());
            append(bytes);
        }
    }

    private void append(byte[] bytes) {
        digest.update(bytes);
        if (dependencyWriter!=null) {
            try { dependencyWriter.write(bytes); }
            catch (IOException exception) { throw new IllegalStateException(exception); }
        }
    }

    /** Store exact decision dependencies once per owner; result rows are already preserved in run_item. */
    byte[] sealDependencies() {
        if (dependencyBytes==null) throw new IllegalStateException("snapshot fingerprint is disabled");
        close();
        return dependencyBytes.toByteArray();
    }

    @Override public void close() {
        if (dependencyWriter!=null) {
            try { dependencyWriter.close(); }
            catch (IOException exception) { throw new IllegalStateException(exception); }
            dependencyWriter=null;
        }
    }

    String finish() {
        if (digest == null) throw new IllegalStateException("snapshot fingerprint is disabled");
        sealDependencies();
        return HexFormat.of().formatHex(digest.digest());
    }
}
