package com.fenxiao.distribution.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fenxiao.distribution.repository.DistributionRelationRepository;
import com.fenxiao.distribution.repository.PhoneVerificationCodeRepository;
import com.fenxiao.distribution.service.DistributionBindingService;
import com.fenxiao.distribution.service.SwitchableSmsSender;
import com.fenxiao.distribution.service.UserPasswordLoginService;
import com.fenxiao.user.repository.UserDistributionProfileRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Isolated H2 accounts and mocked SMS only; never connects to an SMS provider or production. */
@ActiveProfiles("test")
@AutoConfigureMockMvc
@SpringBootTest
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class LatinAmericaPhoneAuthFlowTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired DistributionBindingService bindings;
    @Autowired PhoneVerificationCodeRepository codes;
    @Autowired DistributionRelationRepository relations;
    @Autowired UserDistributionProfileRepository users;
    @Autowired UserPasswordLoginService passwords;
    @MockBean SwitchableSmsSender sms;

    @ParameterizedTest
    @CsvSource({"CO,+573001234567,5999757", "CL,+56912345678,5999756", "VE,+584121234567,5999758"})
    void newCountriesCanRegisterUnderBrazilInviterAndLoginWithoutChangingCountry(String country, String phone, long inviterId) throws Exception {
        var inviter = bindings.createProfile(inviterId, "BR", "pt-br", null);
        when(sms.deliveryChannel(phone)).thenReturn("CHUANGLAN");
        issueCode(phone);
        String code = activeCode(phone);
        String response = mvc.perform(post("/api/distribution/auth/phone-login").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("phoneNumber", phone, "verificationCode", code,
                                "inviteCode", inviter.getInviteCode(), "countryCode", country, "languageCode", "es-mx"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.countryCode").value(country))
                .andExpect(jsonPath("$.languageCode").value("es-mx"))
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andReturn().getResponse().getContentAsString();
        long userId = json.readTree(response).path("userId").asLong();
        var relation = relations.findByUserId(userId).orElseThrow();
        assertThat(relation.getLevel1InviterId()).isEqualTo(inviterId);
        assertThat(relation.isCrossCountry()).isTrue();
        assertThat(users.findByPhoneNumber(phone).orElseThrow().getCountryCode()).isEqualTo(country);
        long registeredCount = users.count();

        // An existing account needs no invitation; a login cannot silently change its registered country.
        issueCode(phone);
        String secondCode = activeCode(phone);
        mvc.perform(post("/api/distribution/auth/phone-login").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("phoneNumber", phone, "verificationCode", secondCode, "countryCode", "HK"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(userId))
                .andExpect(jsonPath("$.countryCode").value(country));
        verify(sms, times(2)).sendVerificationCode(eq(phone), org.mockito.ArgumentMatchers.anyString(), anyInt());

        String testPassword = "Latam-Test-Password-2026!";
        String passwordBody = json.writeValueAsString(Map.of("phoneNumber", phone, "password", testPassword));
        mvc.perform(post("/api/distribution/auth/password-login").contentType(MediaType.APPLICATION_JSON).content(passwordBody))
                .andExpect(status().isForbidden());
        passwords.setPassword(userId, testPassword, 1L, "SUPER_ADMIN", "127.0.0.1");
        mvc.perform(post("/api/distribution/auth/password-login").contentType(MediaType.APPLICATION_JSON).content(passwordBody))
                .andExpect(status().isOk()).andExpect(jsonPath("$.userId").value(userId))
                .andExpect(jsonPath("$.countryCode").value(country));
        mvc.perform(post("/api/distribution/auth/password-login").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("phoneNumber", phone, "password", "Wrong-Test-Password!"))))
                .andExpect(status().isForbidden());
        assertThat(users.count()).isEqualTo(registeredCount);
    }

    @Test
    void openingCountriesDoesNotRemoveTheInvitationRequirement() throws Exception {
        String phone = "+573001234568";
        when(sms.deliveryChannel(phone)).thenReturn("CHUANGLAN");
        issueCode(phone);
        mvc.perform(post("/api/distribution/auth/phone-login").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("phoneNumber", phone, "verificationCode", activeCode(phone),
                                "countryCode", "CO", "languageCode", "es-mx"))))
                .andExpect(status().isBadRequest());
        assertThat(users.findByPhoneNumber(phone)).isEmpty();
    }

    private void issueCode(String phone) throws Exception {
        mvc.perform(post("/api/distribution/auth/phone-codes").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("phoneNumber", phone))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.verificationCode").doesNotExist());
    }

    private String activeCode(String phone) {
        return codes.findTopByPhoneNumberAndPurposeAndConsumedFalseOrderByIdDesc(phone, "LOGIN")
                .orElseThrow().getVerificationCode();
    }
}
