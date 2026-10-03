package com.fenxiao.common.api;

public class PasswordLoginRejectedException extends ForbiddenException {
    private final String requestId;

    public PasswordLoginRejectedException(String message, String requestId) {
        super(message);
        this.requestId = requestId;
    }

    public String getRequestId() {
        return requestId;
    }
}
