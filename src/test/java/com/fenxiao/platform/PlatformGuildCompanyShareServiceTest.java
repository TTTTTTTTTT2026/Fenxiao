package com.fenxiao.platform;

import com.fenxiao.platform.service.PlatformGuildCompanyShareService;
import com.fenxiao.platform.dto.PlatformGuildCompanyShareRuleResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@ActiveProfiles("test")
@SpringBootTest
class PlatformGuildCompanyShareServiceTest {
    @Autowired PlatformGuildCompanyShareService shares;
    @Autowired JdbcTemplate jdbc;

    @BeforeEach
    void table() {
        jdbc.execute("drop table if exists platform_guild_company_share_version");
        jdbc.execute("create table platform_guild_company_share_version (id bigint auto_increment primary key,platform_code varchar(32) not null,guild_id varchar(64) not null,share_version int not null,share_rate decimal(8,6) not null,effective_from timestamp not null,effective_to timestamp,rule_status varchar(16) not null,configured_by bigint,approved_by bigint,approved_at timestamp,approval_note varchar(255))");
    }

    @Test
    void savesImmediatelyAndAuditsWhileCancellingFutureSchedules() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime future = now.plusHours(2);
        jdbc.update("insert into platform_guild_company_share_version(platform_code,guild_id,share_version,share_rate,effective_from,rule_status,configured_by,approved_by,approved_at,approval_note) values(?,?,?,?,?,'ACTIVE',?,?,?,'business review complete')",
                "LINKY", "guild-1", 1, new BigDecimal("0.25"), future, 1L, 2L, now.minusHours(1));

        var active = shares.setImmediate("LINKY", "guild-1", new BigDecimal("0.30"), 3L);

        assertThat(active.status()).isEqualTo("ACTIVE");
        assertThat(active.approvedBy()).isNull();
        assertThat(active.effectiveFrom()).isBeforeOrEqualTo(LocalDateTime.now());
        assertThat(shares.findEffective("LINKY", "guild-1", LocalDateTime.now().plusSeconds(1)).orElseThrow()).isEqualByComparingTo("0.30");
        assertThat(shares.history("LINKY", "guild-1")).extracting(PlatformGuildCompanyShareRuleResponse::status)
                .containsExactly("CANCELLED", "ACTIVE");
        assertThat(jdbc.queryForObject("select count(*) from operation_audit_log where module_name='PLATFORM_GUILD_COMPANY_SHARE' and target_id=? and action_name='SET_IMMEDIATE'", Integer.class, active.id())).isEqualTo(1);
    }

    @Test
    void closesThePriorActiveWindowWithoutChangingItsHistoricalRate() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime priorStart = now.minusDays(1);
        jdbc.update("insert into platform_guild_company_share_version(platform_code,guild_id,share_version,share_rate,effective_from,rule_status,configured_by) values(?,?,?,?,?,'ACTIVE',?)",
                "TIMO", "guild-2", 1, new BigDecimal("0.25"), priorStart, 1L);

        var next = shares.setImmediate("TIMO", "guild-2", new BigDecimal("0.30"), 2L);

        assertThat(shares.findEffective("TIMO", "guild-2", priorStart.plusHours(1)).orElseThrow()).isEqualByComparingTo("0.25");
        assertThat(shares.findEffective("TIMO", "guild-2", LocalDateTime.now().plusSeconds(1)).orElseThrow()).isEqualByComparingTo("0.30");
        assertThat(shares.history("TIMO", "guild-2")).hasSize(2);
        assertThat(shares.history("TIMO", "guild-2").getLast().effectiveTo()).isNotNull();
        assertThat(next.status()).isEqualTo("ACTIVE");
    }
}
