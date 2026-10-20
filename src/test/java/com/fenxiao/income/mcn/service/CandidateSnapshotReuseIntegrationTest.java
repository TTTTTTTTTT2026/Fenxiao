package com.fenxiao.income.mcn.service;

import com.fenxiao.platform.service.PlatformGuildCompanyShareService;
import com.fenxiao.relationship.entity.InvitationRelationVersion;
import com.fenxiao.rule.entity.CommissionPolicy;
import com.fenxiao.user.entity.UserDistributionProfile;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.*;
import java.util.Optional;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/** SQL + candidate decision path + formal frozen-points/reversal, entirely synthetic local data. */
class CandidateSnapshotReuseIntegrationTest {
    private static final LocalDate DAY=LocalDate.of(2026,10,12);
    private static final Instant START=Instant.parse("2026-10-11T16:00:00Z");
    private static LocalDateTime utc(Instant instant) { return LocalDateTime.ofInstant(instant,ZoneOffset.UTC); }
    private InvitationBindingDayIntegrationTest.Fixture fixture(boolean reuse) { return new InvitationBindingDayIntegrationTest().fixture(reuse); }
    private int count(InvitationBindingDayIntegrationTest.Fixture f,String table) { return f.jdbc().queryForObject("SELECT COUNT(*) FROM "+table,Integer.class); }
    private String refresh(InvitationBindingDayIntegrationTest.Fixture f) { return f.candidates().refresh("TIMO",DAY).latestRunId(); }

    @Test void repeatedRunsKeepOwnSummariesAndDirectlyReferenceOneCompleteSnapshot() {
        var f=fixture(true);String first=refresh(f);
        int items=count(f,"mcn_income_reward_candidate_run_item");
        String second=refresh(f);String third=refresh(f);
        assertThat(count(f,"mcn_income_reward_candidate_run")).isEqualTo(3);
        assertThat(count(f,"mcn_candidate_snapshot_owner")).isEqualTo(1);
        assertThat(count(f,"mcn_income_reward_candidate_run_item")).isEqualTo(items).isEqualTo(3);
        assertThat(f.jdbc().queryForList("SELECT DISTINCT owner_run_id FROM mcn_candidate_snapshot_ref",String.class)).containsExactly(first);
        assertThat(f.candidates().sample(second,10).runId()).isEqualTo(second);
        assertThat(f.candidates().sample(third,10).items()).isEqualTo(f.candidates().sample(first,10).items());
        assertThat(f.candidates().summary("TIMO",DAY).latestRunId()).isEqualTo(third);
    }

    @Test void unchangedRunsStillReconcileFormalPointsAndCorrectionsAndVoidRemainIdempotent() {
        var f=fixture(true);refresh(f);f.accounts().reconcile("TIMO",DAY);
        refresh(f);f.accounts().reconcile("TIMO",DAY);
        assertThat(count(f,"invitation_reward_account_ledger")).isEqualTo(2);
        assertThat(count(f,"mcn_candidate_snapshot_owner")).isEqualTo(1);
        f.jdbc().update("UPDATE mcn_income_raw_ledger_event SET amount=120");
        refresh(f);f.accounts().reconcile("TIMO",DAY);
        assertThat(f.jdbc().queryForObject("SELECT frozen_points FROM invitation_reward_account WHERE user_id=200",BigDecimal.class)).isEqualByComparingTo("6");
        f.jdbc().update("UPDATE mcn_income_shadow_ledger_projection SET shadow_status='VOIDED'");
        refresh(f);f.accounts().reconcile("TIMO",DAY);
        refresh(f);f.accounts().reconcile("TIMO",DAY);
        assertThat(count(f,"mcn_candidate_snapshot_owner")).isEqualTo(3);
        assertThat(f.jdbc().queryForObject("SELECT SUM(frozen_points) FROM invitation_reward_account",BigDecimal.class)).isZero();
        assertThat(count(f,"mcn_income_team_reward_reserve_fact")).isZero();
    }

    @Test void bindingTimestampPolicyAndEqualRateShareVersionsAreNotMerged() {
        var f=fixture(true);refresh(f);
        when(f.verified().byUser("TIMO",100L)).thenReturn(Optional.of(new McnIncomeVerifiedAccounts.Account(100L,"synthetic",utc(START.plusSeconds(36001)))));
        refresh(f);
        when(f.shares().findEffectiveEvidence("TIMO","guild",utc(START))).thenReturn(Optional.of(
                new PlatformGuildCompanyShareService.EffectiveShare(2,2,new BigDecimal("0.25"),utc(START.minusSeconds(86400)),null,"ACTIVE")));
        refresh(f);
        var changedPolicy=CommissionPolicy.draft("SYNTHETIC","TIMO","ID",2,true,new BigDecimal("0.10"),8,true,new BigDecimal("0.03"),7,false,null,null,utc(START.minusSeconds(86400)),null,1L);
        when(f.policies().findEffective("TIMO","ID",utc(START))).thenReturn(Optional.of(changedPolicy));
        refresh(f);
        assertThat(count(f,"mcn_candidate_snapshot_owner")).isEqualTo(4);
        assertThat(f.jdbc().queryForList("SELECT candidate_amount FROM mcn_income_reward_candidate_run",BigDecimal.class))
                .allSatisfy(amount -> assertThat(amount).isEqualByComparingTo("3.250000"));
    }

    @Test void blockedMissingPolicyAndFirstRelationEvidenceRemainDistinctAndHistoricallyReadable() {
        var f=fixture(true);
        when(f.policies().findEffective("TIMO","ID",utc(START))).thenReturn(Optional.empty());
        String blocked=refresh(f);String duplicate=refresh(f);
        assertThat(count(f,"mcn_candidate_snapshot_owner")).isEqualTo(1);
        assertThat(f.candidates().sample(duplicate,10).items()).isEqualTo(f.candidates().sample(blocked,10).items());
        var policy=CommissionPolicy.draft("NEW","TIMO","ID",2,true,new BigDecimal("0.10"),7,true,new BigDecimal("0.03"),7,false,null,null,utc(START.minusSeconds(86400)),null,1L);
        when(f.policies().findEffective("TIMO","ID",utc(START))).thenReturn(Optional.of(policy));
        refresh(f);
        assertThat(count(f,"mcn_candidate_snapshot_owner")).isEqualTo(2);
        when(f.relations().findByUserIdAndVersionNo(100L,1)).thenReturn(Optional.of(
                InvitationRelationVersion.create(100L,200L,1,utc(START.plusSeconds(3601)),"test","INVITE_CODE",null,null)));
        refresh(f);
        assertThat(count(f,"mcn_candidate_snapshot_owner")).isEqualTo(3);
        assertThat(f.candidates().sample(blocked,10).items()).allSatisfy(item -> assertThat(item.status()).isEqualTo("BLOCKED_NO_POLICY"));
    }

    @Test void emptyResultsAreVersionedAndReusableWithoutLeavingStaleRows() {
        var f=fixture(true);String original=refresh(f);
        f.jdbc().update("DELETE FROM mcn_income_shadow_ledger_projection");
        String empty=refresh(f);refresh(f);
        assertThat(count(f,"mcn_candidate_snapshot_owner")).isEqualTo(2);
        assertThat(count(f,"mcn_income_reward_candidate_run_item")).isEqualTo(3);
        assertThat(count(f,"mcn_income_reward_candidate_projection")).isZero();
        assertThat(f.candidates().sample(empty,10).items()).isEmpty();
        assertThat(f.candidates().sample(original,10).items()).hasSize(2);
    }

    @Test void revisionAndCurrencyAndMovedBusinessDateNeverReuseAcrossScopes() {
        var f=fixture(true);String original=refresh(f);
        f.jdbc().update("UPDATE mcn_income_shadow_ledger_projection SET source_revision='v2'");refresh(f);
        f.jdbc().update("UPDATE mcn_income_raw_ledger_event SET currency_code='TEST2'");refresh(f);
        assertThat(count(f,"mcn_candidate_snapshot_owner")).isEqualTo(3);
        f.jdbc().update("UPDATE mcn_income_shadow_ledger_projection SET business_date=?",DAY.plusDays(1));
        f.candidates().refresh("TIMO",DAY.plusDays(1));refresh(f);
        assertThat(f.jdbc().queryForObject("SELECT COUNT(*) FROM mcn_income_reward_candidate_projection WHERE business_date=?",Integer.class,DAY)).isZero();
        assertThat(count(f,"mcn_income_reward_candidate_projection")).isPositive();
        assertThat(f.candidates().sample(original,10).businessDate()).isEqualTo(DAY);
        assertThat(f.candidates().sample(original,10).items()).hasSize(2);
        assertThat(count(f,"mcn_candidate_snapshot_owner")).isEqualTo(5);
    }

    @Test void disabledWriterKeepsLegacyPerRunEvidenceAndCompatibleReaderWorksAfterDisable() {
        var f=fixture(false);String first=refresh(f);refresh(f);
        assertThat(count(f,"mcn_candidate_snapshot_ref")).isZero();
        assertThat(count(f,"mcn_income_reward_candidate_run_item")).isEqualTo(6);
        assertThat(f.candidates().sample(first,10).items()).hasSize(2);
        // A compatible reader always resolves new references irrespective of the writer feature flag.
        var enabled=fixture(true);String owner=refresh(enabled),reference=refresh(enabled);
        var disabledReader=new CandidateRunSnapshotStore(enabled.jdbc(),false);
        assertThat(disabledReader.ownerFor(reference,"TIMO",DAY)).isEqualTo(owner);
        assertThatThrownBy(() -> disabledReader.ownerFor(reference,"LINKY",DAY)).isInstanceOf(IllegalStateException.class);
        enabled.jdbc().update("DELETE FROM mcn_income_reward_candidate_run_item WHERE run_id=?",owner);
        assertThatThrownBy(() -> disabledReader.ownerFor(reference,"TIMO",DAY)).isInstanceOf(IllegalStateException.class);
    }

    @Test void sameTotalButDifferentIndividualAmountsNeverReuseAndPhysicalInputOrderDoesNotMatter() {
        var f=fixture(true);
        f.jdbc().execute("INSERT INTO mcn_income_raw_ledger_event SELECT 2,source_system,platform_code,'second-event',source_revision,occurred_at,200,currency_code,amount_unit,fact_granularity,source_timezone,period_start,period_end FROM mcn_income_raw_ledger_event WHERE id=1");
        f.jdbc().execute("INSERT INTO mcn_income_shadow_ledger_projection SELECT source_system,platform_code,'second-event',2,source_revision,business_date,resolved_user_id,guild_id,shadow_status FROM mcn_income_shadow_ledger_projection WHERE raw_ledger_event_id=1");
        String initial=refresh(f);
        f.jdbc().execute("CREATE TEMPORARY TABLE reordered AS SELECT * FROM mcn_income_shadow_ledger_projection ORDER BY source_event_id DESC");
        f.jdbc().execute("DELETE FROM mcn_income_shadow_ledger_projection");
        f.jdbc().execute("INSERT INTO mcn_income_shadow_ledger_projection SELECT * FROM reordered");
        refresh(f);
        assertThat(count(f,"mcn_candidate_snapshot_owner")).isEqualTo(1);
        f.jdbc().update("UPDATE mcn_income_raw_ledger_event SET amount=CASE id WHEN 1 THEN 200 ELSE 100 END");
        String swapped=refresh(f);
        assertThat(count(f,"mcn_candidate_snapshot_owner")).isEqualTo(2);
        assertThat(f.jdbc().queryForList("SELECT candidate_amount FROM mcn_income_reward_candidate_run",BigDecimal.class))
                .allSatisfy(amount -> assertThat(amount).isEqualByComparingTo("9.75"));
        assertThat(f.candidates().sample(swapped,10).items()).isNotEqualTo(f.candidates().sample(initial,10).items());
    }

    @Test void zeroIncomeMissingGuildShareInactiveUserAndCountryChangesHaveDistinctEvidence() {
        var f=fixture(true);f.jdbc().update("UPDATE mcn_income_raw_ledger_event SET amount=0");
        refresh(f);refresh(f);
        assertThat(count(f,"mcn_candidate_snapshot_owner")).isEqualTo(1);
        when(f.shares().findEffectiveEvidence("TIMO","guild",utc(START))).thenReturn(Optional.empty());
        refresh(f);refresh(f);
        assertThat(count(f,"mcn_candidate_snapshot_owner")).isEqualTo(2);
        var source=UserDistributionProfile.create(100L,"ID","id","synthetic");source.freezeAccount();
        when(f.users().findById(100L)).thenReturn(Optional.of(source));
        refresh(f);assertThat(count(f,"mcn_candidate_snapshot_owner")).isEqualTo(3);
        source.activateAccount();source.changeCountry("BR");
        refresh(f);assertThat(count(f,"mcn_candidate_snapshot_owner")).isEqualTo(4);
    }

    @Test void reusedRunDoesNotCreditAgainAfterFrozenPointsWereAlreadyReleasedAndVoidStillReverses() {
        var f=fixture(true);refresh(f);f.accounts().reconcile("TIMO",DAY);
        var later=new InvitationRewardAccountService(f.jdbc(),Clock.fixed(Instant.parse("2026-10-22T12:00:00Z"),ZoneOffset.UTC),7,new InvitationCommissionReportProjector(f.jdbc()));
        assertThat(later.releaseDue()).isEqualTo(2);
        int postings=count(f,"invitation_reward_account_ledger");
        refresh(f);later.reconcile("TIMO",DAY);
        assertThat(count(f,"invitation_reward_account_ledger")).isEqualTo(postings);
        assertThat(f.jdbc().queryForObject("SELECT SUM(available_points) FROM invitation_reward_account",BigDecimal.class)).isEqualByComparingTo("6.5");
        f.jdbc().update("UPDATE mcn_income_shadow_ledger_projection SET shadow_status='VOIDED'");
        refresh(f);later.reconcile("TIMO",DAY);refresh(f);later.reconcile("TIMO",DAY);
        assertThat(f.jdbc().queryForObject("SELECT SUM(available_points) FROM invitation_reward_account",BigDecimal.class)).isZero();
        assertThat(f.jdbc().queryForObject("SELECT SUM(frozen_points) FROM invitation_reward_account",BigDecimal.class)).isZero();
    }
}
