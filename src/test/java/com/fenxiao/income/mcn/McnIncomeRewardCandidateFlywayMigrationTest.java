package com.fenxiao.income.mcn;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import static org.assertj.core.api.Assertions.assertThat;

class McnIncomeRewardCandidateFlywayMigrationTest {
    @Test
    void shouldApplyV35RewardCandidateShadowSchema() throws Exception {
        String url = "jdbc:h2:mem:mcn_reward_candidate_v35;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1";
        var dataSource = new DriverManagerDataSource(url, "sa", "");
        new ResourceDatabasePopulator(new ClassPathResource(
                "db/migration/V35__add_mcn_income_reward_candidate_shadow.sql")).execute(dataSource);
        try (var connection = dataSource.getConnection(); var statement = connection.createStatement();
             var result = statement.executeQuery("select count(*) from information_schema.tables where table_schema='public' and table_name in ('mcn_income_reward_candidate_projection','mcn_income_reward_candidate_run')")) {
            result.next();
            assertThat(result.getInt(1)).isEqualTo(2);
        }
    }
}
