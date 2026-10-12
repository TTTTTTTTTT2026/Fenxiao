package com.fenxiao.admin.service;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import static org.assertj.core.api.Assertions.*;

class OperationsDashboardIndexMigrationTest {
 @Test void addsOnlySupportingIndexesAndLeavesBusinessRowsUnchanged(){
  var source=new DriverManagerDataSource("jdbc:h2:mem:ops_index_"+System.nanoTime()+";MODE=MySQL;DB_CLOSE_DELAY=-1","sa","");var jdbc=new JdbcTemplate(source);
  jdbc.execute("CREATE TABLE platform_binding_history(id BIGINT,platform_code VARCHAR(32),to_status VARCHAR(32),occurred_at TIMESTAMP,user_id BIGINT)");
  jdbc.execute("CREATE TABLE linky_verification_attempt(id BIGINT,result_status VARCHAR(32),membership_status VARCHAR(64),attempted_at TIMESTAMP,user_id BIGINT)");
  jdbc.update("INSERT INTO platform_binding_history VALUES(1,'TIMO','VERIFIED','2026-10-12',10)");
  new ResourceDatabasePopulator(new ClassPathResource("db/migration/V78__index_operations_dashboard_evidence.sql")).execute(source);
  assertThat(jdbc.queryForList("SELECT INDEX_NAME FROM INFORMATION_SCHEMA.INDEXES WHERE TABLE_SCHEMA='PUBLIC'",String.class)).contains("IDX_TIMO_VERIFIED_EVENT_DATE","IDX_LINKY_VERIFIED_EVENT_DATE");
  assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM platform_binding_history",Long.class)).isEqualTo(1);
  assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM linky_verification_attempt",Long.class)).isZero();
 }
}
