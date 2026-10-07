package com.fenxiao.distribution.service;

public interface SmsSender {
    void sendVerificationCode(String phoneNumber, String verificationCode, int ttlMinutes);
    default String deliveryChannel() { return "UNKNOWN"; }
    default String deliveryChannel(String phoneNumber) { return deliveryChannel(); }
}
