package com.fenxiao.income.mcn;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;

import static org.assertj.core.api.Assertions.assertThat;

class McnIncomeAccountSyncCheckpointMigrationTest {
    @Test
    void createsAccountScopedProgressAndRecoveryColumns() {
        var dataSource = new DriverManagerDataSource(
                "jdbc:h2:mem:mcn_income_account_sync_v60;MODE=MySQL;DB_CLOSE_DELAY=-1", "sa", "");
        new ResourceDatabasePopulator(new ClassPathResource(
                "db/migration/V63__add_account_scoped_mcn_income_sync_progress.sql")).execute(dataSource);
        JdbcTemplate jdbc = new JdbcTemplate(dataSource);
        jdbc.update("insert into mcn_income_account_sync_checkpoint(checkpoint_key,platform_code,platform_user_id,last_sync_status,history_start,recovery_stage,recovery_from,recovery_to,recovery_window_end) values (?,?,?,?,?,?,?,?,?)",
                "TIMO:123456789012", "TIMO", "123456789012", "RECOVERING", java.sql.Date.valueOf("2026-08-01"),
                "WINDOW_READ", java.sql.Date.valueOf("2026-08-01"), java.sql.Date.valueOf("2026-08-31"),
                java.sql.Date.valueOf("2026-08-31"));
        assertThat(jdbc.queryForObject("select history_coverage_status from mcn_income_account_sync_checkpoint where checkpoint_key=?",
                String.class, "TIMO:123456789012")).isEqualTo("UNKNOWN");
    }
}
