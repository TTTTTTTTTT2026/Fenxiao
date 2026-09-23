package com.fenxiao.income.mcn.service;

import com.fenxiao.income.mcn.entity.McnIncomeRawLedgerEvent;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.List;

/** MCN V2 per-group checksum; group dimensions are deliberately not included in the hash body. */
public final class McnIncomeReconciliationChecksum {
    private McnIncomeReconciliationChecksum() { }

    public static String ofEvents(List<McnIncomeRawLedgerEvent> events) {
        return ofLines(events.stream().map(event -> new Line(event.getSourceEventId(), event.getSourceRevision(),
                event.getAmount())).toList());
    }

    public static String ofLines(List<Line> lines) {
        String body = lines.stream().sorted(Comparator.comparing(Line::sourceEventId))
                .map(line -> line.sourceEventId() + '\u001f' + line.sourceRevision() + '\u001f' + amount(line.amount()))
                .reduce((left, right) -> left + '\n' + right).orElse("");
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(body.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to calculate MCN income checksum", exception);
        }
    }

    private static String amount(BigDecimal value) {
        if (value == null) throw new IllegalArgumentException("MCN income amount is missing");
        return value.signum() == 0 ? "0" : value.stripTrailingZeros().toPlainString();
    }

    public record Line(String sourceEventId, String sourceRevision, BigDecimal amount) { }
}
