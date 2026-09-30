package com.fenxiao.distribution.service;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;

import java.sql.DriverManager;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SmsDailyWhitelistFlywayMigrationTest {
    @Test
    void createsUniquePhoneWhitelistAfterVersion69() throws Exception {
        String url = "jdbc:h2:mem:sms_daily_whitelist_migration;MODE=MySQL;DB_CLOSE_DELAY=-1";
        try (var connection = DriverManager.getConnection(url, "sa", "");
             var statement = connection.createStatement()) {
            statement.execute("create table existing_schema_marker(id bigint primary key)");
        }
        Flyway flyway = Flyway.configure().dataSource(url, "sa", "")
                .locations("classpath:db/migration").baselineOnMigrate(true)
                .baselineVersion("69").target("70").load();
        assertThat(flyway.migrate().migrationsExecuted).isEqualTo(1);
        try (var connection = DriverManager.getConnection(url, "sa", "");
             var statement = connection.createStatement()) {
            statement.execute("insert into sms_daily_whitelist(phone_number,created_by,created_at,updated_at) values('+85250000011',1,current_timestamp,current_timestamp)");
            assertThatThrownBy(() -> statement.execute("insert into sms_daily_whitelist(phone_number,created_by,created_at,updated_at) values('+85250000011',2,current_timestamp,current_timestamp)"))
                    .isInstanceOf(java.sql.SQLException.class);
        }
    }
}
