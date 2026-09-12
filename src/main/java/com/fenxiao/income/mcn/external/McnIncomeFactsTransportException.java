package com.fenxiao.income.mcn.external;

public class McnIncomeFactsTransportException extends RuntimeException {
    private final int statusCode;
    private final Integer retryAfterSeconds;

    public McnIncomeFactsTransportException(String message, int statusCode, Integer retryAfterSeconds, Throwable cause) {
        super(message, cause);
        this.statusCode = statusCode;
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public int getStatusCode() { return statusCode; }
    public Integer getRetryAfterSeconds() { return retryAfterSeconds; }
}
