package com.fenxiao.admin.service;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;

import java.sql.DriverManager;

import static org.assertj.core.api.Assertions.assertThat;

class UserOperationsProfileFlywayMigrationTest {
    @Test
    void addsCurrentProfileHistoryAndGuildFilterIndexesWithoutBackfillingUsers() throws Exception {
        String url = "jdbc:h2:mem:user_operations_v76;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1";
        try (var connection = DriverManager.getConnection(url, "sa", ""); var sql = connection.createStatement()) {
            sql.execute("create table user_distribution_profile (user_id bigint primary key, country_code varchar(10), registered_at timestamp)");
            sql.execute("create table admin_account (id bigint primary key)");
            sql.execute("create table linky_account_binding (id bigint primary key, guild_id varchar(64), user_id bigint)");
            sql.execute("create table platform_account_binding (id bigint primary key, platform_code varchar(32), official_guild_id varchar(64), user_id bigint)");
            sql.execute("insert into user_distribution_profile values (1, 'ID', current_timestamp)");
            sql.execute("insert into admin_account values (7)");
        }
        Flyway flyway = Flyway.configure().dataSource(url, "sa", "")
                .locations("classpath:db/migration").baselineOnMigrate(true).baselineVersion("75").target("76").load();
        assertThat(flyway.migrate().migrationsExecuted).isEqualTo(1);
        try (var connection = DriverManager.getConnection(url, "sa", ""); var sql = connection.createStatement()) {
            try (var rows = sql.executeQuery("select count(*) from user_operations_profile")) {
                assertThat(rows.next()).isTrue();
                assertThat(rows.getLong(1)).isZero();
            }
            sql.execute("insert into user_operations_profile(user_id, operator_admin_id, updated_at) values (1, 7, current_timestamp)");
            try (var rows = sql.executeQuery("select value_code from user_operations_profile where user_id=1")) {
                assertThat(rows.next()).isTrue();
                assertThat(rows.getString(1)).isEqualTo("GENERAL");
            }
        }
    }
}
