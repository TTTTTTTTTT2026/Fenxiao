package com.fenxiao.platform.mcn;

public class McnLinkyTransportException extends RuntimeException {
    private final int statusCode;
    private final String errorCode;
    private final boolean retryable;
    private final String requestId;

    public McnLinkyTransportException(int statusCode, String errorCode, boolean retryable, String requestId) {
        super("MCN Linky verification request failed with HTTP " + statusCode + " (" + errorCode + ")");
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.retryable = retryable;
        this.requestId = requestId;
    }
    public int getStatusCode() { return statusCode; }
    public String getErrorCode() { return errorCode; }
    public boolean isRetryable() { return retryable; }
    public String getRequestId() { return requestId; }
}
