package com.fenxiao.identity;

import com.fenxiao.distribution.service.DistributionBindingService;
import com.fenxiao.identity.service.UserSessionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.test.context.ActiveProfiles;

import javax.sql.DataSource;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@ActiveProfiles("test")
@SpringBootTest
public class UserSessionExpiryMigrationTest {
    @Autowired DistributionBindingService bindingService;
    @Autowired UserSessionService sessionService;
    @Autowired JdbcTemplate jdbc;
    @Autowired DataSource dataSource;

    @Test
    void shouldExtendOnlyStillActiveLegacySessions() {
        long activeUserId = 70500L;
        long expiredUserId = 70501L;
        long revokedUserId = 70502L;
        bindingService.createProfile(activeUserId, "BR", "pt-br", null);
        bindingService.createProfile(expiredUserId, "BR", "pt-br", null);
        bindingService.createProfile(revokedUserId, "BR", "pt-br", null);
        sessionService.issue(activeUserId);
        sessionService.issue(expiredUserId);
        var revokedSession = sessionService.issue(revokedUserId);
        sessionService.revoke(revokedSession.accessToken());

        LocalDateTime now = LocalDateTime.now(Clock.systemUTC()).withNano(0);
        LocalDateTime shortExpiry = now.plusHours(1);
        LocalDateTime oldExpiry = now.minusHours(1);
        jdbc.update("UPDATE user_session SET expires_at = ? WHERE user_id = ?", shortExpiry, activeUserId);
        jdbc.update("UPDATE user_session SET expires_at = ? WHERE user_id = ?", oldExpiry, expiredUserId);
        jdbc.update("UPDATE user_session SET expires_at = ? WHERE user_id = ?", shortExpiry, revokedUserId);

        jdbc.execute("CREATE ALIAS UTC_TIMESTAMP FOR \"com.fenxiao.identity.UserSessionExpiryMigrationTest.utcTimestamp\"");
        new ResourceDatabasePopulator(new ClassPathResource(
                "db/migration/V71__extend_active_user_sessions_to_thirty_days.sql")).execute(dataSource);

        var active = jdbc.queryForMap("SELECT created_at, expires_at FROM user_session WHERE user_id = ?", activeUserId);
        LocalDateTime createdAt = ((Timestamp) active.get("created_at")).toLocalDateTime();
        LocalDateTime extendedExpiry = ((Timestamp) active.get("expires_at")).toLocalDateTime();
        assertThat(extendedExpiry).isBetween(createdAt.plusDays(30).minusSeconds(1), createdAt.plusDays(30).plusSeconds(1));
        assertThat(readExpiry(expiredUserId)).isEqualTo(oldExpiry);
        assertThat(readExpiry(revokedUserId)).isEqualTo(shortExpiry);
    }

    private LocalDateTime readExpiry(long userId) {
        return jdbc.queryForObject("SELECT expires_at FROM user_session WHERE user_id = ?", LocalDateTime.class, userId);
    }

    public static Timestamp utcTimestamp() {
        return Timestamp.valueOf(LocalDateTime.now(Clock.systemUTC()));
    }
}
