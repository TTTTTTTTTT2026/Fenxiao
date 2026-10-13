package com.fenxiao.admin.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fenxiao.admin.entity.AdminAccount;
import com.fenxiao.admin.repository.AdminAccountRepository;
import com.fenxiao.distribution.service.DistributionBindingService;
import com.fenxiao.platform.entity.PlatformAccountBinding;
import com.fenxiao.platform.entity.PlatformBindingHistory;
import com.fenxiao.platform.domain.PlatformBindingStatus;
import com.fenxiao.platform.repository.PlatformAccountBindingRepository;
import com.fenxiao.platform.repository.PlatformBindingHistoryRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import java.time.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties="test.operations-dashboard-isolation=true")
@ActiveProfiles("test")
@AutoConfigureMockMvc
class OperationsDashboardHttpIntegrationTest {
 @TestConfiguration
 static class FixedClockConfig {
  @Bean @Primary Clock fixedDashboardClock() { return Clock.fixed(Instant.parse("2026-10-12T09:00:00Z"),ZoneOffset.UTC); }
 }
 @Autowired Clock clock;
 @Autowired MockMvc mvc; @Autowired ObjectMapper json; @Autowired AdminAccountRepository admins;
 @Autowired DistributionBindingService profiles; @Autowired PlatformAccountBindingRepository bindings;
 @Autowired PlatformBindingHistoryRepository history; @Autowired JdbcTemplate jdbc;

 @Test void realSessionReadsRealSqlAndScopeChangeBlocksAnExistingCacheHit() throws Exception {
  var admin=admins.save(AdminAccount.create("dashboard_admin","Dashboard admin","super_admin","{plain}local-only-dashboard-test",true));
  String session=json.readTree(mvc.perform(post("/admin/auth/session").contentType(MediaType.APPLICATION_JSON)
      .content("{\"username\":\"dashboard_admin\",\"password\":\"local-only-dashboard-test\"}"))
      .andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).path("sessionToken").asText();
  var root=profiles.createProfile(80001L,"ID","id",null);profiles.createProfile(80002L,"ID","id",root.getInviteCode());
  LocalDateTime now=LocalDateTime.ofInstant(clock.instant(),ZoneOffset.UTC);
  // Profile creation uses wall time; pin only these isolated fixtures to the test's UTC day.
  jdbc.update("UPDATE user_distribution_profile SET registered_at=? WHERE user_id IN (80001,80002)",java.sql.Timestamp.valueOf(now.minusHours(1)));
  jdbc.update("UPDATE user_distribution_profile SET country_code='BR',phone_number=? WHERE user_id=80001","+5500000000000");
  jdbc.update("INSERT INTO user_operations_profile(user_id,operator_admin_id,value_code,updated_at) VALUES(80001,?,'GENERAL',?)",admin.getId(),java.sql.Timestamp.valueOf(now));
  var binding=PlatformAccountBinding.submit(80002L,"TIMO","123456789012",now.minusMinutes(1));
  binding.verify("g1",now.minusDays(1),"MCN_TIMO","test-evidence",now.minusSeconds(30));binding=bindings.save(binding);
  history.save(PlatformBindingHistory.record(binding,PlatformBindingStatus.VERIFYING,"AUTHORITATIVE_VERIFIED",null,"MCN_TIMO",null,now.minusSeconds(30)));
  long historyBefore=history.count();long relationsBefore=jdbc.queryForObject("SELECT COUNT(*) FROM invitation_relation_version",Long.class);
  mvc.perform(get("/admin/distribution/operations-dashboard").header("X-Admin-Session",session).param("platformCode","TIMO"))
     .andExpect(status().isOk()).andExpect(jsonPath("$.summary.registered").value(2))
     .andExpect(jsonPath("$.summary.invited").value(1)).andExpect(jsonPath("$.firstVerified").value(1))
     .andExpect(jsonPath("$.ranks[0].inviterId").value(80001))
     .andExpect(jsonPath("$.ranks[0].phoneNumber").value("+5500000000000"))
     .andExpect(jsonPath("$.ranks[0].countryCode").value("BR"))
     .andExpect(jsonPath("$.ranks[0].operatorName").value("Dashboard admin"));
  mvc.perform(get("/admin/distribution/operations-dashboard").header("X-Admin-Session",session).param("platformCode","TIMO").param("countryCode","ID"))
     .andExpect(status().isOk()).andExpect(jsonPath("$.ranks[0].countryCode").value("BR"))
     .andExpect(jsonPath("$.ranks[0].registered").value(1));
  mvc.perform(get("/admin/distribution/operations-dashboard").header("X-Admin-Session",session).param("platformCode","TIMO").param("trendPeriod","yesterday").param("period","3"))
     .andExpect(status().isOk()).andExpect(jsonPath("$.trend.length()").value(1))
     .andExpect(jsonPath("$.trend[0].date").value("2026-10-11")).andExpect(jsonPath("$.trend[0].registered").value(0))
     .andExpect(jsonPath("$.firstVerified").value(1)).andExpect(jsonPath("$.summary.registered").value(2));
  mvc.perform(get("/admin/distribution/operations-dashboard").header("X-Admin-Session",session).param("platformCode","TIMO").param("trendPeriod","365"))
     .andExpect(status().isBadRequest());
  mvc.perform(get("/admin/distribution/operations-dashboard/users").header("X-Admin-Session",session).param("platformCode","TIMO").param("kind","INVITER").param("inviterId","80001"))
     .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(1)).andExpect(jsonPath("$.items[0].bindingStatus").value("VERIFIED"));
  mvc.perform(get("/admin/distribution/operations-dashboard").param("platformCode","TIMO")).andExpect(status().isForbidden());
  mvc.perform(get("/admin/distribution/operations-dashboard").header("X-Admin-Session",session).param("platformCode","ALL")).andExpect(status().isBadRequest());
  assertThat(history.count()).isEqualTo(historyBefore);assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM invitation_relation_version",Long.class)).isEqualTo(relationsBefore);
  admin.updateProfile("Dashboard admin","super_admin","TIMO","*","*");admins.save(admin);
  mvc.perform(get("/admin/distribution/operations-dashboard").header("X-Admin-Session",session).param("platformCode","TIMO")).andExpect(status().isForbidden());
 }
}
