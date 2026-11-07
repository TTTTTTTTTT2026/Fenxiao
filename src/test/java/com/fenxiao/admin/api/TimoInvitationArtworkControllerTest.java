package com.fenxiao.admin.api;

import com.fenxiao.admin.service.AdminPermission;
import com.fenxiao.admin.service.AdminSessionService;
import com.fenxiao.audit.entity.OperationAuditLog;
import com.fenxiao.audit.repository.OperationAuditLogRepository;
import com.fenxiao.common.api.ForbiddenException;
import org.flywaydb.core.Flyway;
import org.h2.jdbcx.JdbcDataSource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.server.ResponseStatusException;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TimoInvitationArtworkControllerTest {
    private final AdminSessionService sessions = mock(AdminSessionService.class);
    private final OperationAuditLogRepository audits = mock(OperationAuditLogRepository.class);
    private TimoInvitationArtworkController controller;

    @BeforeEach
    void setUp() {
        var database = new JdbcDataSource();
        database.setURL("jdbc:h2:mem:" + UUID.randomUUID() + ";MODE=MySQL;DB_CLOSE_DELAY=-1");
        var jdbc = new JdbcTemplate(database);
        jdbc.execute("CREATE TABLE business_marker (id INT PRIMARY KEY)");
        jdbc.update("INSERT INTO business_marker VALUES (1)");
        Flyway.configure().dataSource(database).baselineOnMigrate(true).baselineVersion("86").target("87")
                .locations("classpath:db/migration").load().migrate();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM business_marker", Integer.class)).isEqualTo(1);
        controller = new TimoInvitationArtworkController(jdbc, sessions, audits);
        when(sessions.assertPermission("ops", AdminPermission.WRITE)).thenReturn(principal("*"));
    }

    @Test
    void replacesOnlyTheRequestedLanguageAndServesValidatedImageBytes() throws Exception {
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
