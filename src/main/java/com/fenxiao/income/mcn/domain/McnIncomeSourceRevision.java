package com.fenxiao.income.mcn.domain;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * The version portion of an MCN Income Facts V1 source revision is the only
 * authoritative ordering key. The digest identifies immutable contents and
 * must never decide which revision is newer.
 */
public record McnIncomeSourceRevision(int revisionNumber, String value) {
    private static final Pattern V1 = Pattern.compile("^(\\d{6}):[0-9a-f]{64}$");

    public static McnIncomeSourceRevision parse(String value) {
        String normalized = value == null ? "" : value.trim();
        Matcher matcher = V1.matcher(normalized);
        if (!matcher.matches()) {
            throw new IllegalArgumentException("MCN V1 source revision must use DDDDDD:<64 lowercase hex characters>");
        }
        int revisionNumber = Integer.parseInt(matcher.group(1));
        if (revisionNumber < 1) {
            throw new IllegalArgumentException("MCN V1 source revision number must be at least 000001");
        }
        return new McnIncomeSourceRevision(revisionNumber, normalized);
    }

    public String fixedWidthPrefix() {
        return value.substring(0, 6);
    }
}
