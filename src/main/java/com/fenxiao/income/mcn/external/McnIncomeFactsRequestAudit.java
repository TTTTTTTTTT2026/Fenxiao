package com.fenxiao.income.mcn.external;

import java.time.Instant;

/** Sanitised request metadata: no payload, platform account, cursor or signature is retained here. */
public record McnIncomeFactsRequestAudit(String requestId, String bodySha256, Instant requestedAt,
                                         int httpStatus, long latencyMillis) {
}
