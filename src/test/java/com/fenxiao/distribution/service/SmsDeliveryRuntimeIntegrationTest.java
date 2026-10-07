package com.fenxiao.distribution.service;

import com.fenxiao.admin.service.AdminSessionService;
import com.fenxiao.distribution.repository.SmsDeliveryControlRepository;
import com.fenxiao.distribution.repository.PhoneVerificationCodeRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@ActiveProfiles("test")
@SpringBootTest(properties = {
        "app.sms.provider=CHUANGLAN",
        "app.sms.chuanglan.account=I1234567",
        "app.sms.chuanglan.password=fake-test-secret"
})
class SmsDeliveryRuntimeIntegrationTest {
    @Autowired SmsDeliveryControlService controls;
    @Autowired SmsDeliveryControlRepository repository;
    @Autowired PhoneVerificationCodeRepository codes;
    @Autowired PhoneAuthService phoneAuthService;
    @Autowired SmsSender sender;

    @Test
    void staysOffAfterDeploymentThenSwitchesWithoutRestartAndCanBeClosedAgain() {
        repository.deleteAll();
        assertThat(sender).isInstanceOf(SwitchableSmsSender.class);
        assertThat(controls.status().ready()).isTrue();
        assertThat(controls.status().active()).isFalse();
        // The initial request stays local even though the server has adapter credentials.
        sender.sendVerificationCode("+85250000001", "123456", 10);

        var actor = new AdminSessionService.AdminPrincipal(42L, "root", "Root", "super_admin",
                false, 7L, false, null, "*", "*", "*");
        assertThat(controls.setEnabled(true, actor, "127.0.0.1").active()).isTrue();
        assertThat(repository.findById(1L).orElseThrow().isEnabled()).isTrue();
        assertThat(sender.deliveryChannel("+8613800000000")).isEqualTo("INTERNAL");
        phoneAuthService.issueCode("+8613800000000");
        var chinaCode = codes.findTopByPhoneNumberAndPurposeAndConsumedFalseOrderByIdDesc("+8613800000000", "LOGIN")
                .orElseThrow();
        assertThat(chinaCode.getDeliveryChannel()).isEqualTo("INTERNAL");
        assertThat(chinaCode.getDeliveryStatus()).isEqualTo("ACCEPTED");
        assertThat(controls.setEnabled(false, actor, "127.0.0.1").active()).isFalse();
        assertThat(repository.findById(1L).orElseThrow().isEnabled()).isFalse();
    }
}
