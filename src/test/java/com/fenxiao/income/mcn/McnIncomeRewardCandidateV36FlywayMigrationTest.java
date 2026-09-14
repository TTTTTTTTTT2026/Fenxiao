package com.fenxiao.income.mcn;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;

import static org.assertj.core.api.Assertions.assertThat;

class McnIncomeRewardCandidateV36FlywayMigrationTest {
    @Test
    void shouldApplyCommissionPolicySchemaAfterCandidateSchema() {
        var dataSource = new DriverManagerDataSource("jdbc:h2:mem:commission-policy-v36;MODE=MySQL;DB_CLOSE_DELAY=-1", "sa", "");
        new ResourceDatabasePopulator(new ClassPathResource("db/migration/V35__add_mcn_income_reward_candidate_shadow.sql"),
                new ClassPathResource("db/migration/V36__add_commission_policy_configuration.sql")).execute(dataSource);
        JdbcTemplate jdbc = new JdbcTemplate(dataSource);
        assertThat(jdbc.queryForObject("select count(*) from commission_policy", Integer.class)).isZero();
        assertThat(jdbc.queryForObject("select count(*) from information_schema.columns where table_name='MCN_INCOME_REWARD_CANDIDATE_PROJECTION' and column_name='COMMISSION_POLICY_CODE'", Integer.class)).isEqualTo(1);
    }
}
