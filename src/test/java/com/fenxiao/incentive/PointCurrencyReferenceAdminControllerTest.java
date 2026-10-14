package com.fenxiao.incentive;

import com.fenxiao.admin.entity.AdminAccount;
import com.fenxiao.admin.repository.AdminAccountRepository;
import com.fenxiao.audit.repository.OperationAuditLogRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import java.util.Map;
import java.util.UUID;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ActiveProfiles("test") @SpringBootTest @AutoConfigureMockMvc @Transactional
class PointCurrencyReferenceAdminControllerTest {
    @Autowired MockMvc mvc;@Autowired JdbcTemplate jdbc;@Autowired AdminAccountRepository admins;
    @Autowired ObjectMapper json;@Autowired OperationAuditLogRepository audits;
    static final String BASE="/admin/finance/point-currency-rates";
    @BeforeEach void schema() {
        if(jdbc.queryForObject("SELECT COUNT(*) FROM information_schema.tables WHERE LOWER(table_name)='point_currency_country'",Integer.class)==0)
            new ResourceDatabasePopulator(new ClassPathResource("db/migration/V79__add_point_currency_reference_rates.sql")).execute(jdbc.getDataSource());
    }
    @Test void requiresFinanceSessionForEveryEndpointAndDoesNotAcceptLegacyTokens()throws Exception {
        mvc.perform(get(BASE)).andExpect(status().isForbidden());
        mvc.perform(get(BASE).header("X-Admin-Token","test-admin-token")).andExpect(status().isForbidden());
        String admin=login("admin");String ops=login("operations");
        for(String token:new String[]{admin,ops}) {
            mvc.perform(get(BASE).header("X-Admin-Session",token)).andExpect(status().isForbidden());
            mvc.perform(put(BASE+"/ID").header("X-Admin-Session",token).contentType("application/json").content("{\"enabled\":true,\"currencyPerPoint\":\"150\",\"expectedVersion\":0}")).andExpect(status().isForbidden());
            mvc.perform(post(BASE+"/preview").header("X-Admin-Session",token).contentType("application/json").content("{\"points\":\"100\",\"countryCode\":\"ID\"}")).andExpect(status().isForbidden());
            mvc.perform(get(BASE+"/ID/history").header("X-Admin-Session",token)).andExpect(status().isForbidden());
        }
    }
    @Test void financeCanSavePreviewAndReadAuditableHistoryButCannotChooseUsd()throws Exception {
        String token=login("finance");long auditBefore=audits.count();
        mvc.perform(get(BASE).header("X-Admin-Session",token)).andExpect(status().isOk()).andExpect(jsonPath("$.referenceOnly").value(true)).andExpect(jsonPath("$.settings.length()").value(5));
        mvc.perform(put(BASE+"/ID").header("X-Admin-Session",token).contentType("application/json")
                .content("{\"enabled\":true,\"currencyPerPoint\":\"150.25\",\"expectedVersion\":0,\"currencyCode\":\"USD\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.country.currencyCode").value("IDR")).andExpect(jsonPath("$.current.currencyPerPoint").value("150.25"));
        mvc.perform(post(BASE+"/preview").header("X-Admin-Session",token).contentType("application/json").content("{\"points\":\"100\",\"countryCode\":\"ID\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.amount").value("15025.00")).andExpect(jsonPath("$.referenceOnly").value(true));
        mvc.perform(get(BASE+"/ID/history").header("X-Admin-Session",token)).andExpect(status().isOk()).andExpect(jsonPath("$.items.length()").value(1));
        assertThat(audits.count()).isEqualTo(auditBefore+1);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM point_currency_rate_version",Integer.class)).isEqualTo(1);
    }
    @Test void validatesPayloadAndReturnsAUsefulConflictInsteadOfOverwriting()throws Exception {
        String token=login("super_admin");
        mvc.perform(put(BASE+"/ID").header("X-Admin-Session",token).contentType("application/json").content("{\"enabled\":true,\"currencyPerPoint\":\"0\",\"expectedVersion\":0}")).andExpect(status().isBadRequest());
        mvc.perform(put(BASE+"/ID").header("X-Admin-Session",token).contentType("application/json").content("{\"enabled\":true,\"currencyPerPoint\":\"150\",\"expectedVersion\":0}")).andExpect(status().isOk());
        mvc.perform(put(BASE+"/ID").header("X-Admin-Session",token).contentType("application/json").content("{\"enabled\":true,\"currencyPerPoint\":\"200\",\"expectedVersion\":0}"))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.message").value("配置已被其他人修改，请刷新后重试"));
        mvc.perform(post(BASE+"/preview").header("X-Admin-Session",token).contentType("application/json").content("{\"points\":\"100\",\"countryCode\":\"ID\",\"userId\":100}"))
                .andExpect(status().isBadRequest());
    }
    private String login(String role)throws Exception {
        String name="fx_"+UUID.randomUUID().toString().substring(0,8);
        admins.save(AdminAccount.create(name,"测试财务",role,"{plain}local-currency-test-password",true));
        String response=mvc.perform(post("/admin/auth/session").contentType("application/json").content(json.writeValueAsString(Map.of("username",name,"password","local-currency-test-password"))))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return json.readTree(response).get("sessionToken").asText();
    }
}
