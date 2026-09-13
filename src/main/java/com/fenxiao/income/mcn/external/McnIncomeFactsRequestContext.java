package com.fenxiao.income.mcn.external;

import java.util.UUID;

/** A caller-supplied request ID lets a controlled smoke test repeat the same MCN delivery. */
public record McnIncomeFactsRequestContext(String requestId) {
    public McnIncomeFactsRequestContext {
        if (requestId == null || requestId.isBlank() || requestId.length() > 128) {
            throw new IllegalArgumentException("MCN request id is required and must be at most 128 characters");
        }
    }

    public static McnIncomeFactsRequestContext newRequest() {
        return new McnIncomeFactsRequestContext(UUID.randomUUID().toString());
    }
}
