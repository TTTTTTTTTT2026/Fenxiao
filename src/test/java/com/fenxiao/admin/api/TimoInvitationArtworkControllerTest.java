package com.fenxiao.admin.api;

import com.fenxiao.admin.service.AdminPermission;
import com.fenxiao.admin.service.AdminSessionService;
import com.fenxiao.audit.entity.OperationAuditLog;
import com.fenxiao.audit.repository.OperationAuditLogRepository;
import com.fenxiao.common.api.ForbiddenException;
import org.flywaydb.core.Flyway;
import org.h2.jdbcx.JdbcDataSource;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.mockito.ArgumentCaptor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.server.ResponseStatusException;

import javax.imageio.ImageIO;
import javax.sql.DataSource;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.util.UUID;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.io.TempDir;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TimoInvitationArtworkControllerTest {
    @TempDir
    Path oldMigrations;
    private final AdminSessionService sessions = mock(AdminSessionService.class);
    private final OperationAuditLogRepository audits = mock(OperationAuditLogRepository.class);
    private TimoInvitationArtworkController controller;

    private void setUp(DataSource database) {
        var jdbc = new JdbcTemplate(database);
        jdbc.execute("CREATE TABLE business_marker (id INT PRIMARY KEY)");
        jdbc.update("INSERT INTO business_marker VALUES (1)");
        Flyway.configure().dataSource(database).baselineOnMigrate(true).baselineVersion("86").target("87")
                .locations("classpath:db/migration").load().migrate();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM business_marker", Integer.class)).isEqualTo(1);
        controller = new TimoInvitationArtworkController(jdbc, sessions, audits);
        when(sessions.assertPermission("ops", AdminPermission.WRITE)).thenReturn(principal("*"));
    }

    private void setUpH2() {
        var database = new JdbcDataSource();
        database.setURL("jdbc:h2:mem:" + UUID.randomUUID() + ";MODE=MySQL;DB_CLOSE_DELAY=-1");
        setUp(database);
    }

    @Test
    void replacesOnlyTheRequestedLanguageAndServesValidatedImageBytes() throws Exception {
        setUpH2();
        verifyImageReplacement();
    }

    @Test
    @EnabledIfEnvironmentVariable(named = "BANDEIRA_MYSQL_TEST_URL", matches = ".+")
    void migratesAndReplacesArtworkOnIsolatedMySql() throws Exception {
        String url = System.getenv("BANDEIRA_MYSQL_TEST_URL");
        if (!url.matches("jdbc:mysql://127\\.0\\.0\\.1:[0-9]+/bandeira_snapshot_test\\?.+")) {
            throw new IllegalArgumentException("isolated MySQL only");
        }
        String password = System.getenv().getOrDefault("BANDEIRA_MYSQL_TEST_PASSWORD", "");
        var jdbc = new JdbcTemplate(new DriverManagerDataSource(url, "root", password));
        String schema = "bandeira_snapshot_test_" + UUID.randomUUID().toString().replace("-", "");
        jdbc.execute("CREATE DATABASE " + schema);
        try {
            String testUrl = url.replace("/bandeira_snapshot_test?", "/" + schema + "?");
            setUp(new DriverManagerDataSource(testUrl, "root", password));
            verifyImageReplacement();
            // PR186 has identical V1-V86 scripts and Flyway configuration/dependencies.
            // Exercise its default validate/migrate behavior with the future V87 retained.
            try (var migrations = Files.list(Path.of("src/main/resources/db/migration"))) {
                for (Path migration : migrations.filter(p -> !p.getFileName().toString().startsWith("V87__")).toList()) {
                    Files.copy(migration, oldMigrations.resolve(migration.getFileName()));
                }
            }
            var oldFlyway = Flyway.configure().dataSource(testUrl, "root", password)
                    .locations("filesystem:" + oldMigrations.toAbsolutePath()).load();
            oldFlyway.validate();
            assertThat(oldFlyway.migrate().migrationsExecuted).isZero();
            var migrated = new JdbcTemplate(new DriverManagerDataSource(testUrl, "root", password));
            assertThat(migrated.queryForObject("SELECT COUNT(*) FROM timo_invitation_artwork", Integer.class)).isEqualTo(2);
            assertThat(migrated.queryForObject("SELECT COUNT(*) FROM flyway_schema_history WHERE version='87' AND success=1", Integer.class)).isEqualTo(1);
        } finally {
            jdbc.execute("DROP DATABASE " + schema);
        }
    }

    private void verifyImageReplacement() throws Exception {
        assertThat(controller.read("id").getStatusCode().value()).isEqualTo(404);
        byte[] first = png(4);
        byte[] next = png(8);
        byte[] other = png(12);
        assertThat(controller.replace("ops", "id", image(first), new MockHttpServletRequest())
                .getStatusCode().value()).isEqualTo(204);
        controller.replace("ops", "zh", image(other), new MockHttpServletRequest());
        controller.replace("ops", "id", image(next), new MockHttpServletRequest());
        var response = controller.read("id");
        assertThat(response.getHeaders().getContentType()).hasToString("image/png");
        assertThat(response.getHeaders().getCacheControl()).isEqualTo("no-store");
        assertThat(response.getHeaders().getFirst("X-Content-Type-Options")).isEqualTo("nosniff");
        assertThat(response.getBody()).isEqualTo(next);
        assertThat(controller.read("zh").getBody()).isEqualTo(other);
        assertThat(controller.read("en").getStatusCode().value()).isEqualTo(404);
        var changes = ArgumentCaptor.forClass(OperationAuditLog.class);
        verify(audits, times(3)).save(changes.capture());
        assertThat(changes.getAllValues()).extracting(OperationAuditLog::getTargetId).containsExactly(2L, 1L, 2L);
    }

    @Test
    void rejectsSpoofedImagesUnsupportedLanguagesAndScopedWriters() throws Exception {
        setUpH2();
        when(sessions.assertPermission("reader", AdminPermission.WRITE)).thenThrow(new ForbiddenException("denied"));
        when(sessions.assertPermission("regional", AdminPermission.WRITE)).thenReturn(principal("ID"));
        var request = new MockHttpServletRequest();
        byte[] valid = png(2);
        assertThatThrownBy(() -> controller.replace("reader", "id", image(valid), request)).isInstanceOf(ForbiddenException.class);
        assertThatThrownBy(() -> controller.replace("regional", "id", image(valid), request)).isInstanceOf(ForbiddenException.class);
        assertThatThrownBy(() -> controller.replace("ops", "fr", image(valid), request)).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> controller.replace("ops", "id", image(new byte[] {1, 2, 3}), request))
                .isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> controller.replace("ops", "id", image(new byte[1024 * 1024 + 1]), request))
                .isInstanceOf(ResponseStatusException.class);
        assertThat(controller.read("id").getStatusCode().value()).isEqualTo(404);
        verify(audits, times(0)).save(any());
    }

    @Test
    void acceptsAnImageExactlyAtTheOneMiBLimit() throws Exception {
        setUpH2();
        byte[] bytes = java.util.Arrays.copyOf(png(2), 1024 * 1024);
        assertThat(controller.replace("ops", "id", image(bytes), new MockHttpServletRequest())
                .getStatusCode().value()).isEqualTo(204);
        assertThat(controller.read("id").getBody()).isEqualTo(bytes);
    }

    private static AdminSessionService.AdminPrincipal principal(String region) {
        return new AdminSessionService.AdminPrincipal(1L, "ops", "Ops", "operations", false,
                1L, false, LocalDateTime.now().plusHours(1), "TIMO", "*", region);
    }

    private static MockMultipartFile image(byte[] bytes) {
        return new MockMultipartFile("image", "sample.png", "image/png", bytes);
    }

    private static byte[] png(int width) throws Exception {
        var output = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(width, 3, BufferedImage.TYPE_INT_RGB), "png", output);
        return output.toByteArray();
    }
}
