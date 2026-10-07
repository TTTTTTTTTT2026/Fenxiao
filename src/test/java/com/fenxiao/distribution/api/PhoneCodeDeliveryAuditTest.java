package com.fenxiao.distribution.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fenxiao.admin.service.AdminSessionService;
import com.fenxiao.admin.service.PhoneVerificationAuditService;
import com.fenxiao.distribution.repository.PhoneVerificationCodeRepository;
import com.fenxiao.distribution.service.DistributionBindingService;
import com.fenxiao.distribution.service.SmsSubmissionException;
import com.fenxiao.distribution.service.SwitchableSmsSender;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ActiveProfiles("test")
@AutoConfigureMockMvc
@SpringBootTest
class PhoneCodeDeliveryAuditTest {
    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper json;
    @Autowired private PhoneVerificationCodeRepository codes;
    @Autowired private PhoneVerificationAuditService audit;
    @Autowired private DistributionBindingService bindings;
    @MockBean private SwitchableSmsSender smsSender;

    @Test
    void rejectedProviderSubmissionRemainsReviewableAndUsableForAssistedLogin() throws Exception {
        String phone = "+85253240001";
        String inviteCode = bindings.createProfile(5999901L, "HK", "zh", null).getInviteCode();
        when(smsSender.deliveryChannel(phone)).thenReturn("CHUANGLAN");
        doThrow(new SmsSubmissionException("PROVIDER_114", "verification SMS is temporarily unavailable"))
                .when(smsSender).sendVerificationCode(anyString(), anyString(), anyInt());

        mockMvc.perform(post("/api/distribution/auth/phone-codes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("phoneNumber", phone))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("verification SMS is temporarily unavailable"));

        var stored = codes.findTopByPhoneNumberAndPurposeAndConsumedFalseOrderByIdDesc(phone, "LOGIN").orElseThrow();
        assertThat(stored.getDeliveryChannel()).isEqualTo("CHUANGLAN");
        assertThat(stored.getDeliveryStatus()).isEqualTo("FAILED");
        assertThat(stored.getDeliveryErrorCode()).isEqualTo("PROVIDER_114");

        var operator = new AdminSessionService.AdminPrincipal(1L, "admin", "Admin", "SUPER_ADMIN",
                false, 1L, false, LocalDateTime.now().plusHours(1), "*", "*", "*");
        var listed = audit.list(phone, 0, 20, operator, "127.0.0.1");
        assertThat(listed.items()).hasSize(1);
        assertThat(listed.items().get(0).deliveryStatus()).isEqualTo("FAILED");
        assertThat(audit.reveal(stored.getId(), operator, "127.0.0.1").verificationCode())
                .isEqualTo(stored.getVerificationCode());

        mockMvc.perform(post("/api/distribution/auth/phone-login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "phoneNumber", phone,
                                "verificationCode", stored.getVerificationCode(),
                                "countryCode", "HK",
                                "inviteCode", inviteCode))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty());
    }
}
