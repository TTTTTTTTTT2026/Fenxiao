package com.fenxiao.incentive;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;

import static org.assertj.core.api.Assertions.assertThat;

class ConfirmedBaseUserGradeRulesMigrationTest {
    @Test
    void activatesExactlyTheConfirmedThresholdsForEverySupportedScope() {
        var dataSource = new DriverManagerDataSource(
                "jdbc:h2:mem:confirmed_base_grade_rules;MODE=MySQL;DB_CLOSE_DELAY=-1", "sa", "");
        new ResourceDatabasePopulator(new ClassPathResource(
                "db/migration/V46__add_user_grade_governance.sql")).execute(dataSource);
        var migration = new ResourceDatabasePopulator(new ClassPathResource(
                "db/migration/V64__activate_confirmed_base_user_grade_rules.sql"));
        migration.execute(dataSource);
        JdbcTemplate jdbc = new JdbcTemplate(dataSource);

        assertThat(jdbc.queryForObject("select count(*) from user_grade_rule_version", Integer.class)).isEqualTo(18);
        for (String platform : new String[]{"TIMO", "LINKY"}) {
            for (String country : new String[]{"BR", "ID", "MX"}) {
                assertRule(jdbc, platform, country, "NEW_STAR", 3);
                assertRule(jdbc, platform, country, "SILVER", 10);
                assertRule(jdbc, platform, country, "GOLD", 30);
            }
        }
        assertThat(jdbc.queryForObject("select count(*) from user_grade_rule_version where rule_status='ACTIVE' "
                + "and guild_id is null and required_direct_income=0 and effective_from<=current_timestamp "
                + "and effective_to is null and approved_at is not null", Integer.class)).isEqualTo(18);

        migration.execute(dataSource);
        assertThat(jdbc.queryForObject("select count(*) from user_grade_rule_version", Integer.class)).isEqualTo(18);
    }

    @Test
    void preservesAnAlreadyActiveScopeInsteadOfOverwritingItsHistory() {
        var dataSource = new DriverManagerDataSource(
                "jdbc:h2:mem:confirmed_base_grade_existing;MODE=MySQL;DB_CLOSE_DELAY=-1", "sa", "");
        new ResourceDatabasePopulator(new ClassPathResource(
                "db/migration/V46__add_user_grade_governance.sql")).execute(dataSource);
        JdbcTemplate jdbc = new JdbcTemplate(dataSource);
        jdbc.update("insert into user_grade_rule_version(rule_code,rule_version,grade_code,platform_code,"
                + "country_code,required_direct_invite_count,required_direct_income,effective_from,rule_status) "
                + "values('EXISTING-NEW-STAR',1,'NEW_STAR','TIMO','BR',3,0,current_timestamp,'ACTIVE')");

        new ResourceDatabasePopulator(new ClassPathResource(
                "db/migration/V64__activate_confirmed_base_user_grade_rules.sql")).execute(dataSource);

        assertThat(jdbc.queryForObject("select count(*) from user_grade_rule_version", Integer.class)).isEqualTo(18);
        assertThat(jdbc.queryForObject("select rule_code from user_grade_rule_version "
                + "where platform_code='TIMO' and country_code='BR' and grade_code='NEW_STAR'", String.class))
                .isEqualTo("EXISTING-NEW-STAR");
    }

    private void assertRule(JdbcTemplate jdbc, String platform, String country, String grade, int expected) {
        Integer count = jdbc.queryForObject("select required_direct_invite_count from user_grade_rule_version "
                        + "where platform_code=? and country_code=? and grade_code=? and rule_status='ACTIVE'",
                Integer.class, platform, country, grade);
        assertThat(count).isEqualTo(expected);
    }
}
