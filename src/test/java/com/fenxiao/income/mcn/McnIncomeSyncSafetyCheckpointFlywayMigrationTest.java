package com.fenxiao.income.mcn;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;

import static org.assertj.core.api.Assertions.assertThat;

class McnIncomeSyncSafetyCheckpointFlywayMigrationTest {
    @Test
    void shouldAddNextAttemptAtToTheExistingSyncCheckpoint() {
        var dataSource = new DriverManagerDataSource("jdbc:h2:mem:mcn_income_sync_safety_v41;MODE=MySQL;DB_CLOSE_DELAY=-1", "sa", "");
        new ResourceDatabasePopulator(
                new ClassPathResource("db/migration/V31__add_mcn_income_pull_sync_state.sql"),
                new ClassPathResource("db/migration/V41__add_mcn_income_sync_safety_checkpoint.sql"))
                .execute(dataSource);

        JdbcTemplate jdbc = new JdbcTemplate(dataSource);
        assertThat(jdbc.queryForObject("select count(*) from information_schema.columns "
                + "where table_name='MCN_INCOME_SYNC_CHECKPOINT' and column_name='NEXT_ATTEMPT_AT'", Integer.class))
                .isEqualTo(1);
    }
}
