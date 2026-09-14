package com.fenxiao.income.mcn;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;

import static org.assertj.core.api.Assertions.assertThat;

class McnIncomeDataQualityReviewFlywayMigrationTest {
    @Test
    void shouldApplyV39IncomeDataQualityReviewSchema() {
        var dataSource = new DriverManagerDataSource("jdbc:h2:mem:mcn_income_quality_review_v39;MODE=MySQL;DB_CLOSE_DELAY=-1", "sa", "");
        new ResourceDatabasePopulator(new ClassPathResource("db/migration/V39__add_mcn_income_data_quality_review.sql")).execute(dataSource);
        JdbcTemplate jdbc = new JdbcTemplate(dataSource);
        assertThat(jdbc.queryForObject("select count(*) from mcn_income_data_quality_review", Integer.class)).isZero();
        assertThat(jdbc.queryForObject("select count(*) from information_schema.table_constraints where constraint_name='UK_MCN_INCOME_QUALITY_REVIEW_REVISION'", Integer.class)).isEqualTo(1);
    }
}
