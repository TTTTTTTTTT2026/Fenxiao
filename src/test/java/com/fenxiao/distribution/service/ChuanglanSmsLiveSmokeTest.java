package com.fenxiao.distribution.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;

import java.security.SecureRandom;

import static org.assertj.core.api.Assertions.assertThat;

/** Run only with -Dchuanglan.sms.live-smoke=true and an explicitly authorized test recipient. */
@EnabledIfSystemProperty(named = "chuanglan.sms.live-smoke", matches = "true")
class ChuanglanSmsLiveSmokeTest {
    @Test
    void submitsOneVerificationMessageToTheExplicitTestRecipient() {
        String account = System.getenv("SMS_CHUANGLAN_ACCOUNT");
        String password = System.getenv("SMS_CHUANGLAN_PASSWORD");
        String recipient = System.getenv("SMS_CHUANGLAN_SMOKE_RECIPIENT");
        assertThat(account).isNotBlank();
        assertThat(password).isNotBlank();
        assertThat(recipient).isNotBlank().doesNotContain(",");
        var properties = new ChuanglanSmsProperties();
        properties.setAccount(account);
        properties.setPassword(password);
        String code = "%06d".formatted(new SecureRandom().nextInt(1_000_000));
        new ChuanglanSmsSender(properties, new ObjectMapper()).sendVerificationCode(recipient, code, 10);
    }
}
