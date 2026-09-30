package com.fenxiao.distribution.service;

public class SmsSubmissionException extends IllegalStateException {
    private final String errorCode;

    public SmsSubmissionException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public SmsSubmissionException(String errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }

    public String getErrorCode() { return errorCode; }
}
