package com.fenxiao.income.mcn;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;

import static org.assertj.core.api.Assertions.assertThat;

class McnIncomeRewardCandidateRunSnapshotFlywayMigrationTest {
    @Test
    void shouldCreateAnImmutableCandidateRunSnapshotTable() {
        var dataSource = new DriverManagerDataSource("jdbc:h2:mem:mcn_income_candidate_snapshot_v42;MODE=MySQL;DB_CLOSE_DELAY=-1", "sa", "");
        new ResourceDatabasePopulator(
                new ClassPathResource("db/migration/V35__add_mcn_income_reward_candidate_shadow.sql"),
                new ClassPathResource("db/migration/V42__add_mcn_income_reward_candidate_run_snapshot.sql"))
                .execute(dataSource);

        JdbcTemplate jdbc = new JdbcTemplate(dataSource);
        assertThat(jdbc.queryForObject("select count(*) from mcn_income_reward_candidate_run_item", Integer.class)).isZero();
        assertThat(jdbc.queryForObject("select count(*) from information_schema.table_constraints where constraint_name='UK_MCN_INCOME_REWARD_CANDIDATE_RUN_ITEM'", Integer.class)).isEqualTo(1);
    }
}
