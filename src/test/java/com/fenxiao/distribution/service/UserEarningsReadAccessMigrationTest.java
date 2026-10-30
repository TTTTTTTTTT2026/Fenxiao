package com.fenxiao.distribution.service;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.dao.DataIntegrityViolationException;
import javax.sql.DataSource;
import java.util.UUID;
import static org.assertj.core.api.Assertions.*;

class UserEarningsReadAccessMigrationTest {
    @Test void h2CreatesEmptyPermissionTableWithOneRowPerUserAndApp() {
        verify(new DriverManagerDataSource("jdbc:h2:mem:earnings_grant_"+UUID.randomUUID()+";MODE=MySQL;DB_CLOSE_DELAY=-1","sa",""));
    }
    @Test @EnabledIfEnvironmentVariable(named="BANDEIRA_MYSQL_TEST_URL",matches=".+")
    void mysqlCreatesSameEmptyTableWithoutChangingBusinessData() {
        String url=System.getenv("BANDEIRA_MYSQL_TEST_URL");
        if(!url.matches("jdbc:mysql://127\\.0\\.0\\.1:[0-9]+/bandeira_snapshot_test\\?.+")) throw new IllegalArgumentException("isolated MySQL only");
        String password=System.getenv().getOrDefault("BANDEIRA_MYSQL_TEST_PASSWORD","");
        var jdbc=new JdbcTemplate(new DriverManagerDataSource(url,"root",password));
        String database="bandeira_snapshot_test_"+UUID.randomUUID().toString().replace("-","");
        jdbc.execute("CREATE DATABASE "+database);
        try {verify(new DriverManagerDataSource(url.replace("/bandeira_snapshot_test?","/"+database+"?"),"root",password));}
        finally {if(database.matches("bandeira_snapshot_test_[a-f0-9]{32}")) jdbc.execute("DROP DATABASE "+database);}
    }
    private void verify(DataSource source) {
        var jdbc=new JdbcTemplate(source);
        jdbc.execute("CREATE TABLE business_marker(id INT PRIMARY KEY)");jdbc.update("INSERT INTO business_marker VALUES(1)");
        Flyway.configure().dataSource(source).baselineOnMigrate(true).baselineVersion("82").target("83")
                .locations("classpath:db/migration").load().migrate();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM user_earnings_read_access",Integer.class)).isZero();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM business_marker",Integer.class)).isEqualTo(1);
        jdbc.update("INSERT INTO user_earnings_read_access(user_id,platform_code,enabled,version_no,updated_by,updated_at) VALUES(1,'TIMO',true,1,1,CURRENT_TIMESTAMP),(1,'LINKY',false,1,1,CURRENT_TIMESTAMP)");
        assertThatThrownBy(()->jdbc.update("INSERT INTO user_earnings_read_access(user_id,platform_code,enabled,version_no,updated_by,updated_at) VALUES(1,'TIMO',true,2,1,CURRENT_TIMESTAMP)"))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM user_earnings_read_access",Integer.class)).isEqualTo(2);
    }
}
