package com.fenxiao.platform;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import javax.sql.DataSource;
import java.util.UUID;
import static org.assertj.core.api.Assertions.*;

class TimoGuildCountryPolicyMigrationTest {
    @Test void h2MigrationCreatesOnlyEmptyConfigurationAndEnforcesOneOwnerPerCountry() {
        var source = new DriverManagerDataSource("jdbc:h2:mem:timo_country_" + UUID.randomUUID() + ";MODE=MySQL;DB_CLOSE_DELAY=-1", "sa", "");
        verifyMigration(source);
    }

    @Test
    @EnabledIfEnvironmentVariable(named = "BANDEIRA_MYSQL_TEST_URL", matches = ".+")
    void mysql84MigrationEnforcesTheSameKeysWithoutTouchingExistingBusinessTables() {
        String url = System.getenv("BANDEIRA_MYSQL_TEST_URL");
        if (!url.matches("jdbc:mysql://127\\.0\\.0\\.1:[0-9]+/bandeira_snapshot_test\\?.+")) throw new IllegalArgumentException("only isolated local MySQL is permitted");
        String password = System.getenv().getOrDefault("BANDEIRA_MYSQL_TEST_PASSWORD", "");
        var admin = new JdbcTemplate(new DriverManagerDataSource(url, "root", password));
        String database = "bandeira_snapshot_test_" + UUID.randomUUID().toString().replace("-", "");
        admin.execute("CREATE DATABASE " + database);
        try {
            verifyMigration(new DriverManagerDataSource(url.replace("/bandeira_snapshot_test?", "/" + database + "?"), "root", password));
        } finally {
            if (database.matches("bandeira_snapshot_test_[a-f0-9]{32}")) admin.execute("DROP DATABASE " + database);
        }
    }

    private void verifyMigration(DataSource source) {
        var jdbc = new JdbcTemplate(source);
        jdbc.execute("CREATE TABLE existing_business_marker (id INT PRIMARY KEY)");
        jdbc.update("INSERT INTO existing_business_marker(id) VALUES(1)");
        Flyway.configure().dataSource(source).baselineOnMigrate(true).baselineVersion("81").target("82")
                .locations("classpath:db/migration").load().migrate();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM existing_business_marker", Integer.class)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM timo_guild_country_policy", Integer.class)).isZero();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM timo_guild_accepted_country", Integer.class)).isZero();
        jdbc.update("INSERT INTO timo_guild_country_policy(guild_id,version_no,updated_by,updated_at) VALUES('test-mx',1,0,CURRENT_TIMESTAMP),('test-br',1,0,CURRENT_TIMESTAMP)");
        jdbc.update("INSERT INTO timo_guild_accepted_country(guild_id,country_code) VALUES('test-mx','CO'),('test-mx','VE')");
        assertThatThrownBy(() -> jdbc.update("INSERT INTO timo_guild_accepted_country(guild_id,country_code) VALUES('test-br','CO')"))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM timo_guild_accepted_country", Integer.class)).isEqualTo(2);
    }
}
