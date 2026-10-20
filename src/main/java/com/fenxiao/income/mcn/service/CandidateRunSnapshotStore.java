package com.fenxiao.income.mcn.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

/** Immutable audit storage only; never bypasses candidate calculation or account reconciliation. */
@Component
public class CandidateRunSnapshotStore {
    private final JdbcTemplate jdbc;
    private final boolean reuseEnabled;

    public CandidateRunSnapshotStore(JdbcTemplate jdbc,
            @Value("${app.mcn-candidate-snapshot.reuse-enabled:false}") boolean reuseEnabled) {
        this.jdbc = jdbc;
        this.reuseEnabled = reuseEnabled;
    }

    boolean reuseEnabled() { return reuseEnabled; }

    /** Platform, not date: corrected events can move between dates. Held until the outer transaction ends. */
    void lockPlatform(String platform) {
        if (!TransactionSynchronizationManager.isActualTransactionActive())
            throw new IllegalStateException("candidate snapshot requires an enclosing transaction");
        String locked = jdbc.queryForObject("SELECT platform_code FROM mcn_candidate_snapshot_lock WHERE platform_code=? FOR UPDATE", String.class, platform);
        if (!platform.equals(locked)) throw new IllegalStateException("candidate snapshot lock is missing");
    }

    void snapshot(String runId, String platform, LocalDate date, CandidateSnapshotFingerprint evidence, Runnable copyItems) {
        if (!reuseEnabled) { copyItems.run(); return; }
        byte[] dependencies = evidence.sealDependencies();
        int[] count = {0};
        // Stream the complete result, including blocked/base rows. IDs and runtime timestamps are deliberately excluded.
        jdbc.query("""
                SELECT source_system,platform_code,source_event_id,raw_ledger_event_id,source_revision,calculation_version,
                       business_date,occurred_at,source_user_id,source_guild_id,recipient_user_id,reward_level,
                       invitation_version_no,rule_id,commission_policy_id,commission_policy_code,rule_rate,base_amount,
                       company_share_rate,company_income_base_amount,candidate_amount,currency_code,amount_unit,candidate_status,decision_reason
                FROM mcn_income_reward_candidate_projection
                WHERE source_system='MCN' AND platform_code=? AND business_date=?
                ORDER BY source_event_id,reward_level
                """, (RowCallbackHandler) rs -> {
            evidence.row("item", rs.getString(1),rs.getString(2),rs.getString(3),rs.getLong(4),rs.getString(5),rs.getString(6),
                    rs.getObject(7,LocalDate.class),rs.getTimestamp(8).toInstant(),rs.getObject(9,Long.class),rs.getString(10),
                    rs.getObject(11,Long.class),rs.getInt(12),rs.getObject(13,Integer.class),rs.getObject(14,Long.class),
                    rs.getObject(15,Long.class),rs.getString(16),rs.getBigDecimal(17),rs.getBigDecimal(18),rs.getBigDecimal(19),
                    rs.getBigDecimal(20),rs.getBigDecimal(21),rs.getString(22),rs.getString(23),rs.getString(24),rs.getString(25));
            count[0]++;
        }, platform, date);
        evidence.row("item-count", count[0]);
        String fingerprint = evidence.finish();
        List<Owner> owners = jdbc.query("""
                SELECT owner_run_id,item_count FROM mcn_candidate_snapshot_owner
                WHERE platform_code=? AND business_date=? AND format_version=? AND fingerprint=?
                """, (rs,n) -> new Owner(rs.getString(1),rs.getInt(2)), platform,date,CandidateSnapshotFingerprint.FORMAT,fingerprint);
        String owner;
        if (owners.isEmpty()) {
            copyItems.run();
            verifyCount(runId, count[0]);
            jdbc.update("INSERT INTO mcn_candidate_snapshot_owner(owner_run_id,platform_code,business_date,format_version,fingerprint,item_count,dependency_evidence_gzip) VALUES (?,?,?,?,?,?,?)",
                    runId,platform,date,CandidateSnapshotFingerprint.FORMAT,fingerprint,count[0],dependencies);
            owner = runId;
        } else {
            Owner existing = owners.getFirst();
            if (existing.count() != count[0]) throw new IllegalStateException("candidate snapshot metadata mismatch");
            verifyCount(existing.runId(), existing.count());
            owner = existing.runId();
        }
        jdbc.update("INSERT INTO mcn_candidate_snapshot_ref(run_id,owner_run_id) VALUES (?,?)",runId,owner);
    }

    /** Always reference-aware, even with writing disabled. No reference means an untouched legacy run. */
    String ownerFor(String runId, String platform, LocalDate date) {
        List<Owner> owners = jdbc.query("""
                SELECT r.owner_run_id,o.item_count FROM mcn_candidate_snapshot_ref r
                JOIN mcn_candidate_snapshot_owner o ON o.owner_run_id=r.owner_run_id
                JOIN mcn_income_reward_candidate_run owner_run ON owner_run.run_id=o.owner_run_id
                WHERE r.run_id=? AND o.platform_code=? AND o.business_date=?
                  AND owner_run.platform_code=o.platform_code AND owner_run.business_date=o.business_date
                """, (rs,n) -> new Owner(rs.getString(1),rs.getInt(2)),runId,platform,date);
        if (!owners.isEmpty()) {
            Owner owner=owners.getFirst();
            verifyCount(owner.runId(),owner.count());
            return owner.runId();
        }
        Integer references = jdbc.queryForObject("SELECT COUNT(*) FROM mcn_candidate_snapshot_ref WHERE run_id=?",Integer.class,runId);
        if (!Objects.equals(references,0)) throw new IllegalStateException("candidate snapshot reference is invalid");
        return runId;
    }

    private void verifyCount(String owner, int expected) {
        Integer actual = jdbc.queryForObject("SELECT COUNT(*) FROM mcn_income_reward_candidate_run_item WHERE run_id=?",Integer.class,owner);
        if (!Objects.equals(actual,expected)) throw new IllegalStateException("candidate snapshot evidence is incomplete");
    }

    private record Owner(String runId, int count) { }
}
