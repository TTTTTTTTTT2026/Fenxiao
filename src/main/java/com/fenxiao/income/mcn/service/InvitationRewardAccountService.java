package com.fenxiao.income.mcn.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/** Formal invitation income in points. This service never invokes withdrawal or payment code. */
@Service
public class InvitationRewardAccountService {
    private static final BigDecimal ZERO = BigDecimal.ZERO.setScale(6);
    private final JdbcTemplate jdbc;
    private final Clock clock;
    private final int freezeDays;

    public InvitationRewardAccountService(JdbcTemplate jdbc, Clock clock,
            @Value("${app.invitation-reward.freeze-days:7}") int freezeDays) {
        if (freezeDays < 1 || freezeDays > 365) throw new IllegalArgumentException("invitation reward freeze days out of range");
        this.jdbc = jdbc;
        this.clock = clock;
        this.freezeDays = freezeDays;
    }

    /** Reconcile the latest accepted candidate facts, including voided and re-attributed facts. */
    @Transactional
    public void reconcile(String platform, LocalDate date) {
        List<Candidate> candidates = jdbc.query("""
                SELECT platform_code,source_event_id,reward_level,recipient_user_id,source_revision,business_date,
                       occurred_at,source_user_id,source_guild_id,base_amount,company_share_rate,
                       company_income_base_amount,rule_rate,candidate_amount,amount_unit
                FROM mcn_income_reward_candidate_projection
                WHERE source_system='MCN' AND platform_code=? AND business_date=? AND candidate_status='CANDIDATE'
                  AND calculation_version='INVITATION_COMPANY_INCOME_V2' AND reward_level IN (1,2)
                """, (rs, row) -> new Candidate(rs.getString(1), rs.getString(2), rs.getInt(3), rs.getLong(4),
                rs.getString(5), rs.getObject(6, LocalDate.class), rs.getTimestamp(7).toInstant(), rs.getLong(8),
                rs.getString(9), rs.getBigDecimal(10), rs.getBigDecimal(11), rs.getBigDecimal(12),
                rs.getBigDecimal(13), rs.getBigDecimal(14), rs.getString(15)), platform, date);
        Map<Key, Candidate> current = new HashMap<>();
        for (Candidate candidate : candidates) {
            if (candidate.recipientUserId() <= 0 || candidate.candidateDiamonds() == null) continue;
            current.put(candidate.key(), candidate);
        }
        List<Key> prior = jdbc.query("""
                SELECT platform_code,source_event_id,reward_level,user_id FROM invitation_reward_entry
                WHERE platform_code=? AND business_date=?
                """, (rs, row) -> new Key(rs.getString(1), rs.getString(2), rs.getInt(3), rs.getLong(4)), platform, date);
        for (Key key : prior) reconcileOne(key, current.remove(key));
        for (Candidate candidate : current.values()) reconcileOne(candidate.key(), candidate);
    }

    private void reconcileOne(Key key, Candidate candidate) {
        jdbc.update("INSERT INTO invitation_reward_account(user_id) VALUES (?) ON DUPLICATE KEY UPDATE user_id=user_id", key.userId());
        jdbc.queryForObject("SELECT user_id FROM invitation_reward_account WHERE user_id=? FOR UPDATE", Long.class, key.userId());
        List<Entry> entries = jdbc.query("""
                SELECT id,reward_points,conversion_id,points_per_diamond FROM invitation_reward_entry
                WHERE platform_code=? AND source_event_id=? AND reward_level=? AND user_id=? FOR UPDATE
                """, (rs, row) -> new Entry(rs.getLong(1), rs.getBigDecimal(2), rs.getLong(3), rs.getBigDecimal(4)),
                key.platform(), key.sourceEventId(), key.level(), key.userId());
        Entry old = entries.isEmpty() ? null : entries.getFirst();
        if (candidate == null && old == null) return;
        Conversion conversion = old == null ? activeConversion(key.platform()) : new Conversion(old.conversionId(), old.pointsPerDiamond());
        if (candidate != null && conversion == null) return; // No invented points when a platform rate is missing.
        BigDecimal expected = candidate == null || candidate.candidateDiamonds().signum() <= 0
                ? ZERO : points(candidate, conversion.rate());
        BigDecimal previous = old == null ? ZERO : old.points();
        BigDecimal delta = expected.subtract(previous).setScale(6, RoundingMode.HALF_UP);
        long entryId;
        if (old == null) {
            if (expected.signum() <= 0) return;
            entryId = insertEntry(candidate, conversion, expected);
        } else {
            entryId = old.id();
            if (candidate != null) jdbc.update("""
                    UPDATE invitation_reward_entry SET source_revision=?,business_date=?,occurred_at=?,source_user_id=?,
                    source_guild_id=?,raw_diamonds=?,company_share_rate=?,company_income_diamonds=?,invitation_rate=?,
                    reward_diamonds=?,reward_points=?,updated_at=? WHERE id=?
                    """, candidate.revision(), candidate.businessDate(), Timestamp.from(candidate.occurredAt()),
                    candidate.sourceUserId(), candidate.guildId(), candidate.rawDiamonds(), candidate.companyShareRate(),
                    candidate.companyIncomeDiamonds(), candidate.invitationRate(), candidate.candidateDiamonds(), expected,
                    Timestamp.from(clock.instant()), entryId);
            else jdbc.update("UPDATE invitation_reward_entry SET reward_points=0,reward_diamonds=0,updated_at=? WHERE id=?",
                    Timestamp.from(clock.instant()), entryId);
        }
        if (delta.signum() > 0) credit(key.userId(), entryId, delta, old == null ? "INVITATION_REWARD" : "MCN_INCREASE");
        else if (delta.signum() < 0) reverse(key.userId(), entryId, delta.negate());
    }

    private long insertEntry(Candidate c, Conversion conversion, BigDecimal points) {
        Instant now = clock.instant();
        KeyHolder holder = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                    INSERT INTO invitation_reward_entry(user_id,platform_code,source_event_id,reward_level,source_revision,
                    business_date,occurred_at,source_user_id,source_guild_id,raw_diamonds,company_share_rate,
                    company_income_diamonds,invitation_rate,reward_diamonds,conversion_id,points_per_diamond,
                    reward_points,recorded_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                    """, new String[]{"id"});
            statement.setLong(1, c.recipientUserId()); statement.setString(2, c.platform());
            statement.setString(3, c.sourceEventId()); statement.setInt(4, c.level());
            statement.setString(5, c.revision()); statement.setObject(6, c.businessDate());
            statement.setTimestamp(7, Timestamp.from(c.occurredAt())); statement.setLong(8, c.sourceUserId());
            statement.setString(9, c.guildId()); statement.setBigDecimal(10, c.rawDiamonds());
            statement.setBigDecimal(11, c.companyShareRate()); statement.setBigDecimal(12, c.companyIncomeDiamonds());
            statement.setBigDecimal(13, c.invitationRate()); statement.setBigDecimal(14, c.candidateDiamonds());
            statement.setLong(15, conversion.id()); statement.setBigDecimal(16, conversion.rate());
            statement.setBigDecimal(17, points); statement.setTimestamp(18, Timestamp.from(now));
            statement.setTimestamp(19, Timestamp.from(now)); return statement;
        }, holder);
        return Objects.requireNonNull(holder.getKey()).longValue();
    }

    static BigDecimal points(Candidate c, BigDecimal rate) {
        if (!c.platform().concat("_DIAMOND").equals(c.unit()) || c.rawDiamonds() == null ||
                c.companyShareRate() == null || c.companyIncomeDiamonds() == null || c.invitationRate() == null ||
                c.candidateDiamonds() == null || rate.signum() <= 0) throw new IllegalStateException("invalid invitation reward evidence");
        BigDecimal company = c.rawDiamonds().multiply(c.companyShareRate()).setScale(6, RoundingMode.HALF_UP);
        BigDecimal reward = company.multiply(c.invitationRate()).setScale(6, RoundingMode.HALF_UP);
        if (company.compareTo(c.companyIncomeDiamonds()) != 0 || reward.compareTo(c.candidateDiamonds()) != 0 ||
                c.candidateDiamonds().signum() < 0) throw new IllegalStateException("invitation reward base does not reconcile");
        return reward.multiply(rate).setScale(6, RoundingMode.HALF_UP);
    }

    private Conversion activeConversion(String platform) {
        List<Conversion> rates = jdbc.query("""
                SELECT id,points_per_token FROM token_point_conversion_version
                WHERE platform_code=? AND token_unit=? AND rule_status='ACTIVE' AND effective_from<=?
                  AND (effective_to IS NULL OR effective_to>?) ORDER BY effective_from DESC,id DESC LIMIT 1
                """, (rs, row) -> new Conversion(rs.getLong(1), rs.getBigDecimal(2)), platform,
                platform + "_DIAMOND", Timestamp.from(clock.instant()), Timestamp.from(clock.instant()));
        return rates.isEmpty() || rates.getFirst().rate().signum() <= 0 ? null : rates.getFirst();
    }

    private void credit(long userId, long entryId, BigDecimal amount, String reason) {
        Instant now = clock.instant();
        jdbc.update("INSERT INTO invitation_reward_release_lot(entry_id,user_id,remaining_points,unlock_at) VALUES (?,?,?,?)",
                entryId, userId, amount, Timestamp.from(now.plusSeconds(freezeDays * 86400L)));
        jdbc.update("UPDATE invitation_reward_account SET frozen_points=frozen_points+?,updated_at=? WHERE user_id=?",
                amount, Timestamp.from(now), userId);
        ledger(userId, entryId, reason, amount, ZERO, reason);
    }

    private void reverse(long userId, long entryId, BigDecimal amount) {
        BigDecimal remaining = amount;
        BigDecimal frozenDebit = ZERO;
        List<Lot> lots = jdbc.query("""
                SELECT id,remaining_points FROM invitation_reward_release_lot
                WHERE entry_id=? AND released_at IS NULL AND remaining_points>0 ORDER BY id DESC FOR UPDATE
                """, (rs, row) -> new Lot(rs.getLong(1), rs.getBigDecimal(2)), entryId);
        for (Lot lot : lots) {
            if (remaining.signum() == 0) break;
            BigDecimal debit = remaining.min(lot.remaining());
            jdbc.update("UPDATE invitation_reward_release_lot SET remaining_points=remaining_points-? WHERE id=?", debit, lot.id());
            remaining = remaining.subtract(debit);
            frozenDebit = frozenDebit.add(debit);
        }
        Instant now = clock.instant();
        BigDecimal available = jdbc.queryForObject("SELECT available_points FROM invitation_reward_account WHERE user_id=?",
                BigDecimal.class, userId);
        if (available == null || available.compareTo(remaining) < 0) {
            throw new IllegalStateException("invitation account correction exceeds available points; manual reconciliation required");
        }
        jdbc.update("UPDATE invitation_reward_account SET frozen_points=frozen_points-?,available_points=available_points-?,updated_at=? WHERE user_id=?",
                frozenDebit, remaining, Timestamp.from(now), userId);
        ledger(userId, entryId, "MCN_REVISION", frozenDebit.negate(), remaining.negate(), "source income reduced or invalidated");
    }

    /** Positive corrections get their own seven-day lot; negative corrections never erase original entries. */
    @Transactional
    public int releaseDue() {
        Instant now = clock.instant();
        List<Long> ids = jdbc.query("""
                SELECT id FROM invitation_reward_release_lot
                WHERE released_at IS NULL AND unlock_at<=? ORDER BY unlock_at,id LIMIT 500
                """, (rs, row) -> rs.getLong(1), Timestamp.from(now));
        int released = 0;
        for (Long id : ids) {
            List<Long> owners = jdbc.query("SELECT user_id FROM invitation_reward_release_lot WHERE id=?", (rs, row) -> rs.getLong(1), id);
            if (owners.isEmpty()) continue;
            long userId = owners.getFirst();
            jdbc.queryForObject("SELECT user_id FROM invitation_reward_account WHERE user_id=? FOR UPDATE", Long.class, userId);
            List<DueLot> lots = jdbc.query("""
                    SELECT entry_id,remaining_points FROM invitation_reward_release_lot
                    WHERE id=? AND released_at IS NULL AND unlock_at<=? FOR UPDATE
                    """, (rs, row) -> new DueLot(rs.getLong(1), rs.getBigDecimal(2)), id, Timestamp.from(now));
            if (lots.isEmpty()) continue;
            DueLot lot = lots.getFirst();
            jdbc.update("UPDATE invitation_reward_release_lot SET released_at=? WHERE id=?", Timestamp.from(now), id);
            if (lot.points().signum() > 0) {
                jdbc.update("UPDATE invitation_reward_account SET frozen_points=frozen_points-?,available_points=available_points+?,updated_at=? WHERE user_id=?",
                        lot.points(), lot.points(), Timestamp.from(now), userId);
                ledger(userId, lot.entryId(), "UNFREEZE", lot.points().negate(), lot.points(), "seven-day UTC freeze elapsed");
            }
            released++;
        }
        return released;
    }

    /** Picks up eligible historical facts after a platform conversion rate is first configured. */
    @Transactional
    public void backfill() {
        List<BackfillDate> dates = jdbc.query("""
                SELECT platform_code,business_date FROM (
                  SELECT c.platform_code,c.business_date
                  FROM mcn_income_reward_candidate_projection c
                  LEFT JOIN invitation_reward_entry e ON e.platform_code=c.platform_code
                    AND e.source_event_id=c.source_event_id AND e.reward_level=c.reward_level
                    AND e.user_id=c.recipient_user_id
                  WHERE c.candidate_status='CANDIDATE' AND c.calculation_version='INVITATION_COMPANY_INCOME_V2'
                    AND c.candidate_amount>0 AND c.business_date>=?
                    AND (e.id IS NULL OR e.source_revision<>c.source_revision OR e.reward_diamonds<>c.candidate_amount)
                  UNION
                  SELECT e.platform_code,e.business_date
                  FROM invitation_reward_entry e
                  LEFT JOIN mcn_income_reward_candidate_projection c ON c.source_system='MCN'
                    AND c.platform_code=e.platform_code AND c.source_event_id=e.source_event_id
                    AND c.reward_level=e.reward_level AND c.recipient_user_id=e.user_id
                    AND c.candidate_status='CANDIDATE'
                  WHERE e.reward_points<>0 AND e.business_date>=? AND c.id IS NULL
                ) pending ORDER BY business_date DESC LIMIT 10
                """, (rs, row) -> new BackfillDate(rs.getString(1), rs.getObject(2, LocalDate.class)),
                LocalDate.now(clock).minusDays(90), LocalDate.now(clock).minusDays(90));
        for (BackfillDate date : dates) reconcile(date.platform(), date.date());
    }

    private void ledger(long userId, long entryId, String type, BigDecimal frozen, BigDecimal available, String reason) {
        jdbc.update("""
                INSERT INTO invitation_reward_account_ledger
                (user_id,entry_id,event_type,frozen_delta,available_delta,reason,platform_code,source_event_id,
                 source_revision,reward_level,source_user_id,raw_diamonds,company_share_rate,company_income_diamonds,
                 invitation_rate,reward_diamonds,points_per_diamond,conversion_id,created_at)
                SELECT ?,e.id,?,?,?,?,e.platform_code,e.source_event_id,e.source_revision,e.reward_level,
                       e.source_user_id,e.raw_diamonds,e.company_share_rate,e.company_income_diamonds,
                       e.invitation_rate,e.reward_diamonds,e.points_per_diamond,e.conversion_id,?
                FROM invitation_reward_entry e WHERE e.id=?
                """, userId, type, frozen, available, reason, Timestamp.from(clock.instant()), entryId);
    }

    private record Key(String platform, String sourceEventId, int level, long userId) { }
    static record Candidate(String platform, String sourceEventId, int level, long recipientUserId,
            String revision, LocalDate businessDate, Instant occurredAt, long sourceUserId, String guildId,
            BigDecimal rawDiamonds, BigDecimal companyShareRate, BigDecimal companyIncomeDiamonds,
            BigDecimal invitationRate, BigDecimal candidateDiamonds, String unit) {
        Key key() { return new Key(platform, sourceEventId, level, recipientUserId); }
    }
    private record Entry(long id, BigDecimal points, long conversionId, BigDecimal pointsPerDiamond) { }
    private record Conversion(long id, BigDecimal rate) { }
    private record Lot(long id, BigDecimal remaining) { }
    private record DueLot(long entryId, BigDecimal points) { }
    private record BackfillDate(String platform, LocalDate date) { }
}
