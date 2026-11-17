package com.fenxiao.distribution.api;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.support.JdbcTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import com.fenxiao.distribution.service.RegistrationClaimGuard;
import java.util.UUID;
import java.util.concurrent.*;
import static org.assertj.core.api.Assertions.*;

@EnabledIfEnvironmentVariable(named="BANDEIRA_MYSQL_TEST_URL",matches=".+")
class PreRegistrationMySqlTest {
    @Test void upgradesV88PreservesExistingUsersAndSupportsClaimReservationRelease() throws Exception {
        String url=System.getenv("BANDEIRA_MYSQL_TEST_URL");
        if(!url.matches("jdbc:mysql://127\\.0\\.0\\.1:[0-9]+/bandeira_snapshot_test\\?.+")) throw new IllegalArgumentException("isolated MySQL only");
        String password=System.getenv().getOrDefault("BANDEIRA_MYSQL_TEST_PASSWORD","");
        var control=new JdbcTemplate(new DriverManagerDataSource(url,"root",password));
        String schema="bandeira_snapshot_test_"+UUID.randomUUID().toString().replace("-","");
        control.execute("CREATE DATABASE "+schema+" CHARACTER SET utf8mb4");
        try {
            var source=new DriverManagerDataSource(url.replace("/bandeira_snapshot_test?","/"+schema+"?"),"root",password);
            Flyway.configure().dataSource(source).target("88").load().migrate();var jdbc=new JdbcTemplate(source);
            jdbc.update("INSERT INTO user_distribution_profile(user_id,country_code,language_code,invite_code,distribution_role,user_status,registered_at,created_at,updated_at) VALUES (1,'ID','id','FIXTURE','NORMAL_USER','NORMAL',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)");
            assertThat(Flyway.configure().dataSource(source).target("89").load().migrate().migrationsExecuted).isEqualTo(1);
            assertThat(jdbc.queryForObject("SELECT account_status FROM user_distribution_profile WHERE user_id=1",String.class)).isEqualTo("ACTIVE");
            assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM registration_claim_mutex",Integer.class)).isEqualTo(64);
            String insert="INSERT INTO subordinate_pre_registration(inviter_id,user_id,country_code,phone_number,platform_code,platform_user_id,active_phone,active_account,status,reason_code,submitted_at,expires_at,next_check_at,created_at,updated_at) VALUES (1,2,'ID','+62000000000','TIMO','499999001234','+62000000000','TIMO:499999001234','PENDING','WAITING',CURRENT_TIMESTAMP,DATE_ADD(CURRENT_TIMESTAMP,INTERVAL 72 HOUR),CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)";
            jdbc.update(insert);assertThatThrownBy(()->jdbc.update(insert)).isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
            jdbc.update("UPDATE subordinate_pre_registration SET status='EXPIRED',active_phone=NULL,active_account=NULL");
            jdbc.update(insert);assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM subordinate_pre_registration",Integer.class)).isEqualTo(2);
            var transaction=new TransactionTemplate(new JdbcTransactionManager(source));var guard=new RegistrationClaimGuard(jdbc);
            var locked=new CountDownLatch(1);var release=new CountDownLatch(1);var acquired=new CountDownLatch(1);
            var pool=Executors.newFixedThreadPool(2);
            try {
                var first=pool.submit(()->transaction.execute(status->{guard.lock("TIMO:499999001234");locked.countDown();try{if(!release.await(10,TimeUnit.SECONDS))throw new IllegalStateException("lock timeout");}catch(InterruptedException exception){throw new RuntimeException(exception);}return true;}));
                assertThat(locked.await(10,TimeUnit.SECONDS)).isTrue();
                var second=pool.submit(()->transaction.execute(status->{guard.lock("TIMO:499999001234");acquired.countDown();return true;}));
                assertThat(acquired.await(200,TimeUnit.MILLISECONDS)).isFalse();release.countDown();
                assertThat(first.get(10,TimeUnit.SECONDS)).isTrue();assertThat(second.get(10,TimeUnit.SECONDS)).isTrue();
            }finally{release.countDown();pool.shutdownNow();}
        }finally{control.execute("DROP DATABASE "+schema);}
    }
}
