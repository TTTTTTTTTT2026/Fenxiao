package com.fenxiao.platform;

import com.fenxiao.distribution.service.DistributionBindingService;
import com.fenxiao.platform.domain.PlatformBindingStatus;
import com.fenxiao.platform.entity.PlatformVerificationMock;
import com.fenxiao.platform.repository.PlatformVerificationMockRepository;
import com.fenxiao.platform.service.PlatformBindingVerificationService;
import com.fenxiao.platform.service.PlatformLifecycleService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@ActiveProfiles("test")
@SpringBootTest(properties = "app.platform-verification.source=MOCK")
class PlatformBindingVerificationServiceTest {
    @Autowired DistributionBindingService bindingService;
    @Autowired PlatformLifecycleService lifecycleService;
    @Autowired PlatformBindingVerificationService verificationService;
    @Autowired PlatformVerificationMockRepository mocks;

    @Test
    void shouldVerifyTimoAndLinkyBindingsThroughTheLocalMockChannel() {
        var root = bindingService.createProfile(78100L, "BR", "pt-br", null);
        var timoUser = bindingService.createProfile(78101L, "BR", "pt-br", root.getInviteCode());
        var linkyUser = bindingService.createProfile(78102L, "BR", "pt-br", root.getInviteCode());
        LocalDateTime now = LocalDateTime.now().withNano(0);
        mocks.save(PlatformVerificationMock.create("TIMO", "90000001", false, true,
                "22000448", now, "local-timo-verify", true));
        mocks.save(PlatformVerificationMock.create("LINKY", "90000002", false, true,
                "BR_LINKY_1", now, "local-linky-verify", true));

        lifecycleService.submit(timoUser.getUserId(), "TIMO", "90000001");
        lifecycleService.submit(linkyUser.getUserId(), "LINKY", "90000002");

        var timo = verificationService.verifySubmittedBinding(timoUser.getUserId(), "TIMO");
        var linky = verificationService.verifySubmittedBinding(linkyUser.getUserId(), "LINKY");

        assertThat(timo.getBindingStatus()).isEqualTo(PlatformBindingStatus.VERIFIED);
        assertThat(timo.getOfficialGuildId()).isEqualTo("22000448");
        assertThat(linky.getBindingStatus()).isEqualTo(PlatformBindingStatus.VERIFIED);
        assertThat(linky.getOfficialGuildId()).isEqualTo("BR_LINKY_1");
    }

    @Test
    void shouldRejectMockRecordThatMarksThePlatformIdAsPreexisting() {
        var root = bindingService.createProfile(78200L, "BR", "pt-br", null);
        var user = bindingService.createProfile(78201L, "BR", "pt-br", root.getInviteCode());
        mocks.save(PlatformVerificationMock.create("TIMO", "90000003", true, true,
                "22000448", LocalDateTime.now(), "local-preexisting", true));
        lifecycleService.submit(user.getUserId(), "TIMO", "90000003");

        var result = verificationService.verifySubmittedBinding(user.getUserId(), "TIMO");

        assertThat(result.getBindingStatus()).isEqualTo(PlatformBindingStatus.REJECTED);
        assertThat(result.getRejectionCode()).isEqualTo("PREEXISTING_GLOBAL_ID");
    }
}
