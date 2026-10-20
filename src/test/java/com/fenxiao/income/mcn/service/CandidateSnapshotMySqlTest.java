package com.fenxiao.income.mcn.service;

import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.flywaydb.core.Flyway;

import java.time.LocalDate;
import java.util.UUID;
import java.util.concurrent.*;
import static org.assertj.core.api.Assertions.*;

/** Required in CI against an isolated MySQL 8.4 service; never accepts a production/remote URL. */
@EnabledIfEnvironmentVariable(named="BANDEIRA_MYSQL_TEST_URL",matches=".+")
class CandidateSnapshotMySqlTest {
    private static final LocalDate DAY=LocalDate.of(2026,10,12);
    private JdbcTemplate admin;
    private String database;
    private DriverManagerDataSource source;
    private InvitationBindingDayIntegrationTest.Fixture fixture;

    @BeforeEach void createIsolatedDatabase() {
        String url=System.getenv("BANDEIRA_MYSQL_TEST_URL");
        if (!url.matches("jdbc:mysql://127\\.0\\.0\\.1:[0-9]+/bandeira_snapshot_test\\?.+"))
            throw new IllegalArgumentException("only the explicit local isolated MySQL test service is permitted");
        String password=System.getenv().getOrDefault("BANDEIRA_MYSQL_TEST_PASSWORD","");
        admin=new JdbcTemplate(new DriverManagerDataSource(url,"root",password));
        assertThat(admin.queryForObject("SELECT VERSION()",String.class)).startsWith("8.4.");
        database="bandeira_snapshot_test_"+UUID.randomUUID().toString().replace("-","");
        admin.execute("CREATE DATABASE "+database+" CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci");
        source=new DriverManagerDataSource(url.replace("/bandeira_snapshot_test?","/"+database+"?"),"root",password);
        fixture=new InvitationBindingDayIntegrationTest().fixture(true,source,false);
        Flyway.configure().dataSource(source).baselineOnMigrate(true).baselineVersion("80")
                .target("81").locations("classpath:db/migration").load().migrate();
    }

    @AfterEach void dropOnlyThisTestDatabase() {
        if (admin!=null && database!=null && database.matches("bandeira_snapshot_test_[a-f0-9]{32}"))
            admin.execute("DROP DATABASE "+database);
    }

    @Test void mysqlMigrationIndexesReferencesLegacyReadAndRepeatAreValid() {
        assertThat(fixture.jdbc().queryForObject("SELECT COUNT(*) FROM flyway_schema_history WHERE version='81' AND success=1",Integer.class)).isEqualTo(1);
        String first=fixture.candidates().refresh("TIMO",DAY).latestRunId();
        String second=fixture.candidates().refresh("TIMO",DAY).latestRunId();
        assertThat(fixture.jdbc().queryForObject("SELECT COUNT(*) FROM mcn_income_reward_candidate_run_item",Integer.class)).isEqualTo(3);
        assertThat(fixture.jdbc().queryForObject("SELECT COUNT(*) FROM mcn_candidate_snapshot_owner",Integer.class)).isEqualTo(1);
        assertThat(fixture.candidates().sample(second,10).runId()).isEqualTo(second);
        assertThat(fixture.candidates().sample(second,10).items()).isEqualTo(fixture.candidates().sample(first,10).items());
        assertThat(fixture.jdbc().queryForList("SHOW INDEX FROM mcn_candidate_snapshot_owner")).anySatisfy(row -> {
            assertThat(row.get("Key_name")).isEqualTo("uk_mcn_candidate_snapshot_content");
            assertThat(((Number)row.get("Non_unique")).intValue()).isZero();
        });
        assertThatThrownBy(() -> fixture.jdbc().update("INSERT INTO mcn_candidate_snapshot_ref VALUES ('missing','missing')")).isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
        fixture.accounts().reconcile("TIMO",DAY);fixture.candidates().refresh("TIMO",DAY);fixture.accounts().reconcile("TIMO",DAY);
        assertThat(fixture.jdbc().queryForObject("SELECT COUNT(*) FROM invitation_reward_account_ledger",Integer.class)).isEqualTo(2);
    }

    @Test void concurrentSamePlatformWaitsUntilOuterCommitAndReusesCommittedEvidence() throws Exception {
        var entered=new CountDownLatch(1);var release=new CountDownLatch(1);
        var transaction=new TransactionTemplate(new DataSourceTransactionManager(source));
        try (var executor=Executors.newFixedThreadPool(2)) {
            Future<String> first=executor.submit(() -> transaction.execute(status -> {
                String run=fixture.candidates().refresh("TIMO",DAY).latestRunId();
                entered.countDown();
                try { if(!release.await(10,TimeUnit.SECONDS)) throw new IllegalStateException("test release timed out"); }
                catch(InterruptedException exception){Thread.currentThread().interrupt();throw new IllegalStateException(exception);}
                return run;
            }));
            assertThat(entered.await(5,TimeUnit.SECONDS)).isTrue();
            Future<String> same=executor.submit(() -> fixture.candidates().refresh("TIMO",DAY).latestRunId());
            try {
                assertThatThrownBy(() -> same.get(250,TimeUnit.MILLISECONDS)).isInstanceOf(TimeoutException.class);
            } finally { release.countDown(); }
            String owner=first.get(5,TimeUnit.SECONDS),reference=same.get(5,TimeUnit.SECONDS);
            assertThat(fixture.jdbc().queryForObject("SELECT owner_run_id FROM mcn_candidate_snapshot_ref WHERE run_id=?",String.class,reference)).isEqualTo(owner);
            assertThat(fixture.jdbc().queryForObject("SELECT COUNT(*) FROM mcn_income_reward_candidate_run_item",Integer.class)).isEqualTo(3);
        } finally { release.countDown(); }
    }

    @Test void platformLockCoversDifferentDatesButDoesNotLockOtherPlatform() throws Exception {
        var entered=new CountDownLatch(1);var release=new CountDownLatch(1);
        var transaction=new TransactionTemplate(new DataSourceTransactionManager(source));
        var locks=new CandidateRunSnapshotStore(fixture.jdbc(),true);
        try(var executor=Executors.newFixedThreadPool(3)) {
            Future<?> first=executor.submit(() -> transaction.execute(status -> {
                locks.lockPlatform("TIMO");entered.countDown();
                try { if(!release.await(10,TimeUnit.SECONDS)) throw new IllegalStateException("test release timed out"); }
                catch(InterruptedException exception){Thread.currentThread().interrupt();throw new IllegalStateException(exception);}
                return null;
            }));
            assertThat(entered.await(5,TimeUnit.SECONDS)).isTrue();
            Future<String> anotherDate=executor.submit(() -> fixture.candidates().refresh("TIMO",DAY.plusDays(1)).latestRunId());
            Future<String> other=executor.submit(() -> fixture.candidates().refresh("LINKY",DAY).latestRunId());
            try {
                assertThat(other.get(5,TimeUnit.SECONDS)).isNotBlank();
                assertThatThrownBy(() -> anotherDate.get(250,TimeUnit.MILLISECONDS)).isInstanceOf(TimeoutException.class);
            } finally { release.countDown(); }
            first.get(5,TimeUnit.SECONDS);assertThat(anotherDate.get(5,TimeUnit.SECONDS)).isNotBlank();
        } finally { release.countDown(); }
    }

    @Test void snapshotInsertFailureRollsBackRunProjectionReserveAndMetadata() {
        fixture.jdbc().execute("ALTER TABLE mcn_income_reward_candidate_run_item ADD CONSTRAINT force_test_failure CHECK(candidate_status<>'CANDIDATE')");
        assertThatThrownBy(() -> fixture.candidates().refresh("TIMO",DAY)).isInstanceOf(org.springframework.dao.DataAccessException.class);
        for(String table:new String[]{"mcn_income_reward_candidate_run","mcn_income_reward_candidate_run_item","mcn_income_reward_candidate_projection","mcn_income_team_reward_reserve_fact","mcn_candidate_snapshot_owner","mcn_candidate_snapshot_ref"})
            assertThat(fixture.jdbc().queryForObject("SELECT COUNT(*) FROM "+table,Integer.class)).as(table).isZero();
        fixture.jdbc().execute("ALTER TABLE mcn_income_reward_candidate_run_item DROP CHECK force_test_failure");
        fixture.candidates().refresh("TIMO",DAY);
        assertThat(fixture.jdbc().queryForObject("SELECT COUNT(*) FROM mcn_candidate_snapshot_owner",Integer.class)).isEqualTo(1);
    }
}
