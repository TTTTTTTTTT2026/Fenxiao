package com.fenxiao.incentive;

import com.fenxiao.incentive.service.UserGradeAdminService;
import com.fenxiao.platform.repository.PlatformAccountBindingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import java.time.Clock;
import java.util.List;
import java.util.UUID;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class UserGradeLinkyBindingTest {
    JdbcTemplate jdbc;
    UserGradeAdminService grades;
    PlatformAccountBindingRepository bindings;

    @BeforeEach void setup() {
        jdbc = new JdbcTemplate(new DriverManagerDataSource("jdbc:h2:mem:" + UUID.randomUUID() + ";MODE=MySQL;DB_CLOSE_DELAY=-1", "sa", ""));
        jdbc.execute("create table linky_account_binding(id bigint primary key,user_id bigint,guild_id varchar,registration_eligibility varchar,guild_check_status varchar)");
        jdbc.execute("create table platform_account_binding(user_id bigint,platform_code varchar,binding_status varchar)");
        jdbc.execute("create table invitation_relation_version(user_id bigint,inviter_user_id bigint,effective_to timestamp)");
        bindings = mock(PlatformAccountBindingRepository.class);
        grades = spy(new UserGradeAdminService(jdbc, null, null, bindings, null, Clock.systemUTC()));
    }

    @Test void resolvesOnlyLatestEligibleLinkyBindingWithoutGenericBinding() {
        jdbc.update("insert into linky_account_binding values(1,101,'31350499','ELIGIBLE','MATCHED_OURS')");
        assertThat(grades.verifiedGuild(101, "LINKY")).contains("31350499");
        verifyNoInteractions(bindings);
        jdbc.update("insert into linky_account_binding values(2,101,'31350499','INELIGIBLE','NOT_JOINED')");
        assertThat(grades.verifiedGuild(101, "LINKY")).isEmpty();
        jdbc.update("insert into linky_account_binding values(3,102,'','ELIGIBLE','MATCHED_OURS')");
        assertThat(grades.verifiedGuild(102, "LINKY")).isEmpty();
    }

    @Test void schedulerIncludesLinkyInvitersOnceAndKeepsTimoSeparate() {
        jdbc.update("insert into linky_account_binding values(1,101,'31350499','ELIGIBLE','MATCHED_OURS')");
        jdbc.update("insert into linky_account_binding values(2,102,'31350499','INELIGIBLE','NOT_JOINED')");
        jdbc.update("insert into platform_account_binding values(101,'TIMO','VERIFIED')");
        jdbc.update("insert into invitation_relation_version values(201,101,null),(202,101,null),(203,102,null)");
        doReturn(List.of()).when(grades).evaluate(101, "LINKY");
        doReturn(List.of()).when(grades).evaluate(101, "TIMO");
        assertThat(grades.refreshAllVerifiedUsers()).isEqualTo(2);
        verify(grades).evaluate(101, "LINKY");
        verify(grades).evaluate(101, "TIMO");
        verify(grades, never()).evaluate(102, "LINKY");
    }
}
