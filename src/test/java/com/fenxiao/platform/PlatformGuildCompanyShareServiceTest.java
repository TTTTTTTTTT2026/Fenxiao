package com.fenxiao.platform;

import com.fenxiao.platform.service.PlatformGuildCompanyShareService;
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
    void usesOnlyApprovedVersionsAndClosesThePrecedingEvidenceWindow() {
        LocalDateTime start = LocalDateTime.now().minusDays(1);
        jdbc.update("insert into platform_guild_company_share_version(platform_code,guild_id,share_version,share_rate,effective_from,rule_status,configured_by) values(?,?,?,?,?,'ACTIVE',?)", "LINKY", "guild-1", 1, new BigDecimal("0.25"), start, 1L);
        LocalDateTime future = LocalDateTime.now().plusHours(1);

        var draft = shares.createDraft("LINKY", "guild-1", new BigDecimal("0.30"), future, 2L);
        assertThat(draft.status()).isEqualTo("DRAFT");
        assertThat(shares.findEffective("LINKY", "guild-1", LocalDateTime.now()).orElseThrow()).isEqualByComparingTo("0.25");

        var active = shares.activate(draft.id(), "business review complete", 3L);
        assertThat(active.status()).isEqualTo("ACTIVE");
        assertThat(active.approvedBy()).isEqualTo(3L);
        assertThat(shares.findEffective("LINKY", "guild-1", future.minusMinutes(1)).orElseThrow()).isEqualByComparingTo("0.25");
        assertThat(shares.findEffective("LINKY", "guild-1", future.plusMinutes(1)).orElseThrow()).isEqualByComparingTo("0.30");
        assertThat(shares.history("LINKY", "guild-1")).hasSize(2);
    }
}
