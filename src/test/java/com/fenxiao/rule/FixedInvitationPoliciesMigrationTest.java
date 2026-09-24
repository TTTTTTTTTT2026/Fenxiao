package com.fenxiao.rule;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class FixedInvitationPoliciesMigrationTest {
    private static final String MIGRATION = "db/migration/V65__activate_fixed_two_level_invitation_policies.sql";

    @Test
    void activatesTheConfirmedTwoLevelsForAllSixScopesWithoutChangingTheExpiredLegacyPolicy() {
        JdbcTemplate jdbc = database();
        jdbc.update("""
                insert into commission_policy(policy_code,commission_type,platform_code,country_code,status,effective_from,effective_to)
                values('OLD-TIMO-BR','INVITATION','TIMO','BR','ACTIVE',timestamp '2026-09-14 05:01:00',timestamp '2026-09-16 05:02:00')
                """);

        migrate(jdbc);

        assertThat(jdbc.queryForObject("select count(*) from commission_policy", Integer.class)).isEqualTo(7);
        assertThat(jdbc.queryForObject("select count(*) from commission_policy where policy_code='OLD-TIMO-BR' and status='ACTIVE'", Integer.class)).isEqualTo(1);
        for (String platform : new String[]{"TIMO", "LINKY"}) {
            for (String country : new String[]{"BR", "ID", "MX"}) {
                var row = jdbc.queryForMap("select * from commission_policy where policy_code=?",
                        "CP-INV-V2-" + platform + "-" + country);
                assertThat(row.get("STATUS")).isEqualTo("ACTIVE");
                assertThat(row.get("COMMISSION_TYPE")).isEqualTo("INVITATION");
                assertThat(row.get("ROLE_CODE")).isEqualTo("ALL");
                assertThat(((Number) row.get("MAX_REWARD_LEVEL")).intValue()).isEqualTo(2);
                assertThat(row.get("LEVEL1_ENABLED")).isEqualTo(true);
                assertThat(((BigDecimal) row.get("LEVEL1_RATE"))).isEqualByComparingTo("0.10");
                assertThat(row.get("LEVEL2_ENABLED")).isEqualTo(true);
                assertThat(((BigDecimal) row.get("LEVEL2_RATE"))).isEqualByComparingTo("0.03");
                assertThat(row.get("LEVEL3_ENABLED")).isEqualTo(false);
                assertThat(row.get("EFFECTIVE_TO")).isNull();
                assertThat(((Number) row.get("LEVEL1_FREEZE_DAYS")).intValue()).isZero();
                assertThat(((Number) row.get("LEVEL2_FREEZE_DAYS")).intValue()).isZero();
            }
        }

        migrate(jdbc);
        assertThat(jdbc.queryForObject("select count(*) from commission_policy", Integer.class)).isEqualTo(7);
    }

    @Test
    void preservesAnAlreadyEffectiveScopeInsteadOfOverlappingIt() {
        JdbcTemplate jdbc = database();
        jdbc.update("""
                insert into commission_policy(policy_code,commission_type,platform_code,country_code,status,effective_from)
                values('EXISTING-TIMO-BR','INVITATION','TIMO','BR','ACTIVE',current_timestamp)
                """);

        migrate(jdbc);

        assertThat(jdbc.queryForObject("select count(*) from commission_policy", Integer.class)).isEqualTo(6);
        assertThat(jdbc.queryForObject("select count(*) from commission_policy where platform_code='TIMO' and country_code='BR'", Integer.class)).isEqualTo(1);
    }

    private JdbcTemplate database() {
        var source = new DriverManagerDataSource("jdbc:h2:mem:fixed_invitation_" + UUID.randomUUID()
                + ";MODE=MySQL;DB_CLOSE_DELAY=-1", "sa", "");
        JdbcTemplate jdbc = new JdbcTemplate(source);
        jdbc.execute("""
                create table commission_policy (
                    id bigint auto_increment primary key,
                    policy_code varchar(64) not null unique,
                    commission_type varchar(32) not null,
                    platform_code varchar(32) not null,
                    country_code varchar(10) not null,
                    role_code varchar(32),
                    max_reward_level int,
                    level1_enabled boolean,
                    level1_rate decimal(8,6),
                    level1_freeze_days int,
                    level2_enabled boolean,
                    level2_rate decimal(8,6),
                    level2_freeze_days int,
                    level3_enabled boolean,
                    level3_rate decimal(8,6),
                    level3_freeze_days int,
                    effective_from timestamp not null,
                    effective_to timestamp,
                    status varchar(32) not null,
                    created_by bigint,
                    approved_by bigint,
                    approved_at timestamp,
                    approval_note varchar(255)
                )
                """);
        return jdbc;
    }

    private void migrate(JdbcTemplate jdbc) {
        new ResourceDatabasePopulator(new ClassPathResource(MIGRATION)).execute(jdbc.getDataSource());
    }
}
