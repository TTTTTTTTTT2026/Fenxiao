package com.fenxiao.distribution.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fenxiao.admin.entity.AdminAccount;
import com.fenxiao.admin.repository.AdminAccountRepository;
import com.fenxiao.admin.service.AdminPasswordHasher;
import com.fenxiao.admin.service.AdminSessionService;
import com.fenxiao.distribution.service.DistributionBindingService;
import com.fenxiao.distribution.service.PhoneAuthService;
import com.fenxiao.identity.repository.UserPasswordCredentialRepository;
import com.fenxiao.user.repository.UserDistributionProfileRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ActiveProfiles("test")
@AutoConfigureMockMvc
@SpringBootTest
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
@ExtendWith(OutputCaptureExtension.class)
class UserPasswordLoginFlowTest {
    private static final long USER_ID = 71500L;
    private static final String PHONE = "+5511999991500";
    private static final String FIRST_PASSWORD = "Staff-Password-2026!";
    private static final String SECOND_PASSWORD = "Another-Staff-Password-2026!";

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired DistributionBindingService bindings;
    @Autowired UserDistributionProfileRepository users;
    @Autowired UserPasswordCredentialRepository credentials;
    @Autowired AdminAccountRepository adminAccounts;
    @Autowired AdminPasswordHasher hasher;
    @Autowired AdminSessionService adminSessions;
    @Autowired PhoneAuthService phoneAuth;
    @Autowired JdbcTemplate jdbc;

    @Test
    void onlyAuthorizedExistingUsersCanSignInWithoutSmsAndChangesAreAudited(CapturedOutput output) throws Exception {
        var user = bindings.createProfile(USER_ID, "BR", "pt-br", null);
        user.bindPhoneNumber(PHONE);
        users.save(user);
        long userCount = users.count();
        String root = adminToken("password_root", "super_admin");
        String operations = adminToken("password_operations", "operations");

        mvc.perform(post("/api/distribution/auth/password-login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"phoneNumber\":\"+5511999991599\",\"password\":\"Wrong-Password-2026!\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("phone or password invalid"))
                .andExpect(jsonPath("$.requestId").isNotEmpty())
                .andExpect(jsonPath("$.reason").doesNotExist());
        mvc.perform(post("/api/distribution/auth/password-login").contentType(MediaType.APPLICATION_JSON)
                .content(loginBody(FIRST_PASSWORD))).andExpect(status().isForbidden());
        assertThat(users.count()).isEqualTo(userCount);

        mvc.perform(post("/admin/distribution/user-password-logins/{userId}", USER_ID)
                .header("X-Admin-Session", operations).contentType(MediaType.APPLICATION_JSON)
                .content("{\"password\":\"" + FIRST_PASSWORD + "\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(post("/admin/distribution/user-password-logins/{userId}", USER_ID + 1)
                .header("X-Admin-Session", root).contentType(MediaType.APPLICATION_JSON)
                .content("{\"password\":\"" + FIRST_PASSWORD + "\"}"))
                .andExpect(status().is4xxClientError());
        assertThat(users.count()).isEqualTo(userCount);
        mvc.perform(post("/admin/distribution/user-password-logins/{userId}", USER_ID)
                .header("X-Admin-Session", root).contentType(MediaType.APPLICATION_JSON)
                .content("{\"password\":\"" + FIRST_PASSWORD + "\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.enabled").value(true));
        assertThat(credentials.findById(USER_ID).orElseThrow().getPasswordHash()).doesNotContain(FIRST_PASSWORD);
        mvc.perform(get("/admin/distribution/user-platform-profiles").header("X-Admin-Session", root)
                .param("userId", String.valueOf(USER_ID)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.items[0].passwordLoginEnabled").value(true));

        String firstToken = login(FIRST_PASSWORD);
        mvc.perform(get("/api/distribution/home/{userId}", USER_ID).header("X-Distribution-Token", firstToken))
                .andExpect(status().isOk());
        for (int attempt = 0; attempt < 5; attempt++) {
            mvc.perform(post("/api/distribution/auth/password-login").contentType(MediaType.APPLICATION_JSON)
                    .content(loginBody("Wrong-Password-2026!"))).andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.requestId").isNotEmpty())
                    .andExpect(jsonPath("$.reason").doesNotExist());
        }
        assertThat(credentials.findById(USER_ID).orElseThrow().getLockedUntil()).isNotNull();
        mvc.perform(post("/api/distribution/auth/password-login").contentType(MediaType.APPLICATION_JSON)
                .content(loginBody(FIRST_PASSWORD))).andExpect(status().isForbidden());

        mvc.perform(post("/admin/distribution/user-password-logins/{userId}", USER_ID)
                .header("X-Admin-Session", root).contentType(MediaType.APPLICATION_JSON)
                .content("{\"password\":\"" + SECOND_PASSWORD + "\"}"))
                .andExpect(status().isOk());
        mvc.perform(get("/api/distribution/home/{userId}", USER_ID).header("X-Distribution-Token", firstToken))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/distribution/auth/password-login").contentType(MediaType.APPLICATION_JSON)
                .content(loginBody(FIRST_PASSWORD))).andExpect(status().isForbidden());
        String secondToken = login(SECOND_PASSWORD);

        mvc.perform(delete("/admin/distribution/user-password-logins/{userId}", USER_ID)
                .header("X-Admin-Session", root)).andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(false));
        mvc.perform(get("/admin/distribution/user-platform-profiles").header("X-Admin-Session", root)
                .param("userId", String.valueOf(USER_ID)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.items[0].passwordLoginEnabled").value(false));
        mvc.perform(post("/api/distribution/auth/password-login").contentType(MediaType.APPLICATION_JSON)
                .content(loginBody(SECOND_PASSWORD))).andExpect(status().isForbidden());
        mvc.perform(get("/api/distribution/home/{userId}", USER_ID).header("X-Distribution-Token", secondToken))
                .andExpect(status().isForbidden());
        assertThat(jdbc.queryForObject("select count(*) from operation_audit_log where target_type='user_password_credential' and target_id=?", Integer.class, USER_ID))
                .isEqualTo(3);
        assertThat(jdbc.queryForObject("select count(*) from operation_audit_log where target_type='user_password_credential' and (before_data like ? or after_data like ?)", Integer.class,
                "%" + FIRST_PASSWORD + "%", "%" + SECOND_PASSWORD + "%")).isZero();

        String code = phoneAuth.issueCode(PHONE);
        mvc.perform(post("/api/distribution/auth/phone-login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"phoneNumber\":\"" + PHONE + "\",\"verificationCode\":\"" + code + "\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.userId").value(USER_ID));

        String denialLogs = output.getOut().lines()
                .filter(line -> line.contains("auth=password_login outcome=denied"))
                .collect(Collectors.joining("\n"));
        assertThat(denialLogs).contains("requestId=", "reason=USER_NOT_FOUND", "reason=PASSWORD_LOGIN_NOT_ENABLED",
                "reason=PASSWORD_MISMATCH", "reason=ACCOUNT_TEMPORARILY_LOCKED");
        assertThat(denialLogs).doesNotContain(PHONE, FIRST_PASSWORD, SECOND_PASSWORD, "userId=");
    }

    private String adminToken(String username, String role) {
        String password = "Admin-Test-Password-2026!";
        adminAccounts.save(AdminAccount.create(username, username, role, hasher.hash(password), true));
        return adminSessions.createSession(username, password, false, "127.0.0.1", "JUnit").sessionToken();
    }

    private String login(String password) throws Exception {
        String response = mvc.perform(post("/api/distribution/auth/password-login").contentType(MediaType.APPLICATION_JSON)
                .content(loginBody(password))).andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(USER_ID)).andReturn().getResponse().getContentAsString();
        return json.readTree(response).path("accessToken").asText();
    }

    private String loginBody(String password) {
        return "{\"phoneNumber\":\"" + PHONE + "\",\"password\":\"" + password + "\"}";
    }
}
