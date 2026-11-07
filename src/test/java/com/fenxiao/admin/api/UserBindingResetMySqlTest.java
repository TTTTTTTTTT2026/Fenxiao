package com.fenxiao.admin.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fenxiao.admin.service.AdminSessionService;
import com.fenxiao.admin.service.UserBindingResetService;
import com.fenxiao.audit.repository.OperationAuditLogRepository;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.support.JdbcTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@EnabledIfEnvironmentVariable(named = "BANDEIRA_MYSQL_TEST_URL", matches = ".+")
class UserBindingResetMySqlTest {
    @TempDir Path previousMigrations;

    @Test
    void upgradesV87ResetsEachPlatformAndRetainsArchiveOnApplicationRollback() throws Exception {
        String url = System.getenv("BANDEIRA_MYSQL_TEST_URL");
        if (!url.matches("jdbc:mysql://127\\.0\\.0\\.1:[0-9]+/bandeira_snapshot_test\\?.+")) {
            throw new IllegalArgumentException("isolated MySQL only");
        }
        String password = System.getenv().getOrDefault("BANDEIRA_MYSQL_TEST_PASSWORD", "");
        var control = new JdbcTemplate(new DriverManagerDataSource(url, "root", password));
        String schema = "bandeira_snapshot_test_" + UUID.randomUUID().toString().replace("-", "");
        control.execute("CREATE DATABASE " + schema + " CHARACTER SET utf8mb4");
        try {
            String testUrl = url.replace("/bandeira_snapshot_test?", "/" + schema + "?");
            var source = new DriverManagerDataSource(testUrl, "root", password);
            Flyway.configure().dataSource(source).target("87").load().migrate();
            var jdbc = new JdbcTemplate(source);
            seedV87(jdbc);
            assertThat(Flyway.configure().dataSource(source).target("88").load().migrate().migrationsExecuted).isEqualTo(1);

            var audits = mock(OperationAuditLogRepository.class);
            var resets = new UserBindingResetService(jdbc, new ObjectMapper().findAndRegisterModules(), audits, Clock.systemUTC());
            var transaction = new TransactionTemplate(new JdbcTransactionManager(source));
            var actor = new AdminSessionService.AdminPrincipal(1, "test", "Test", "super_admin", false,
                    1, false, LocalDateTime.now(ZoneOffset.UTC).plusHours(1), "*", "*", "*");
            var timo = resets.preview(17, "TIMO", actor);
            assertThat(timo.status()).isEqualTo("REJECTED");
            assertThat(timo.blockedReason()).isNull();
            transaction.executeWithoutResult(status -> resets.reset(17, "TIMO", timo.revision(), "test", actor, null));
            assertThat(count(jdbc, "platform_account_binding")).isZero();
            assertThat(count(jdbc, "linky_account_binding")).isEqualTo(1);

            var linky = resets.preview(17, "LINKY", actor);
            assertThat(linky.status()).isEqualTo("MATCHED_OURS");
            assertThat(linky.blockedReason()).isNull();
            transaction.executeWithoutResult(status -> resets.reset(17, "LINKY", linky.revision(), "test", actor, null));
            assertThat(count(jdbc, "linky_account_binding")).isZero();
            assertThat(count(jdbc, "invite_binding_registration")).isZero();
            assertThat(count(jdbc, "platform_binding_history")).isEqualTo(1);
            assertThat(jdbc.queryForObject("SELECT available_points FROM invitation_reward_account WHERE user_id=17", Integer.class)).isEqualTo(34);
            verify(audits, times(2)).save(any());

            try (var files = Files.list(Path.of("src/main/resources/db/migration"))) {
                for (Path path : files.filter(p -> Integer.parseInt(p.getFileName().toString().split("__", 2)[0].substring(1)) <= 87).toList()) {
                    Files.copy(path, previousMigrations.resolve(path.getFileName()));
                }
            }
            var rollback = Flyway.configure().dataSource(source)
                    .locations("filesystem:" + previousMigrations.toAbsolutePath()).load();
            rollback.validate();
            assertThat(rollback.migrate().migrationsExecuted).isZero();
            assertThat(count(jdbc, "platform_binding_reset_archive")).isEqualTo(2);
        } finally {
            control.execute("DROP DATABASE " + schema);
        }
    }

    private void seedV87(JdbcTemplate jdbc) {
        jdbc.update("""
                INSERT INTO user_distribution_profile(user_id,country_code,language_code,invite_code,distribution_role,
                    user_status,registered_at,created_at,updated_at)
                VALUES (17,'ID','id','LOCAL17','MEMBER','ACTIVE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
                """);
        jdbc.update("""
                INSERT INTO platform_account_binding(user_id,platform_code,platform_user_id,binding_status,submitted_at)
                VALUES (17,'TIMO','170000000001','REJECTED',CURRENT_TIMESTAMP)
                """);
        jdbc.update("""
                INSERT INTO linky_account_binding(user_id,linky_account,phone_number,guild_id,guild_check_status,
                    registration_eligibility,created_at,updated_at)
                VALUES (17,'17000001','+62800000017','test-guild','MATCHED_OURS','ELIGIBLE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
                """);
        jdbc.update("""
                INSERT INTO invite_binding_registration(product_code,inviter_user_id,invite_code,whatsapp_number,
                    linky_account,bind_status,submitted_at,created_at,updated_at)
                VALUES ('LINKY',17,'LOCAL17','+62800000017','17000001','ACTIVE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
                """);
        jdbc.update("INSERT INTO invitation_reward_account(user_id,frozen_points,available_points) VALUES (17,12,34)");
    }

    private int count(JdbcTemplate jdbc, String table) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM " + table, Integer.class);
    }
}
