package com.fenxiao.user;

import com.fenxiao.user.entity.UserPublicProfile;
import jakarta.persistence.Column;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;

import java.sql.DriverManager;

import static org.assertj.core.api.Assertions.assertThat;

class UserPublicProfileFlywayMigrationTest {
    @Test
    void avatarEntityUsesTheSameLongblobTypeAsTheProductionMigration() throws Exception {
        Column avatarColumn = UserPublicProfile.class.getDeclaredField("avatarData").getAnnotation(Column.class);
        assertThat(avatarColumn.columnDefinition()).isEqualTo("LONGBLOB");
    }

    @Test
    void createsTheProfileStorageAfterVersion67() throws Exception {
        String url = "jdbc:h2:mem:public_profile_migration;MODE=MySQL;DB_CLOSE_DELAY=-1";
        try (var connection = DriverManager.getConnection(url, "sa", "");
             var statement = connection.createStatement()) {
            statement.execute("create table existing_schema_marker(id bigint primary key)");
        }
        Flyway flyway = Flyway.configure().dataSource(url, "sa", "")
                .locations("classpath:db/migration").baselineOnMigrate(true)
                .baselineVersion("67").target("68").load();
        assertThat(flyway.migrate().migrationsExecuted).isEqualTo(1);
        try (var connection = DriverManager.getConnection(url, "sa", "");
             var statement = connection.createStatement()) {
            statement.execute("insert into user_public_profile(user_id,nickname,avatar_media_type,avatar_data) values(1,'test','image/png',X'89504E47')");
            try (var rows = statement.executeQuery("select nickname from user_public_profile where user_id=1")) {
                assertThat(rows.next()).isTrue();
                assertThat(rows.getString(1)).isEqualTo("test");
            }
        }
    }
}
