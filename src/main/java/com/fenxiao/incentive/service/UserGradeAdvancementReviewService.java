package com.fenxiao.incentive.service;

import com.fenxiao.admin.service.AdminSessionService;
import com.fenxiao.audit.entity.OperationAuditLog;
import com.fenxiao.audit.repository.OperationAuditLogRepository;
import com.fenxiao.incentive.dto.UserGradeAdvancementReviewRequest;
import com.fenxiao.incentive.dto.UserGradeAdvancementReviewResponse;
import com.fenxiao.incentive.dto.UserGradeAdvancedEvidenceRequest;
import com.fenxiao.incentive.dto.UserGradeAdvancedEvidenceResponse;
import com.fenxiao.incentive.dto.UserGradePlatinumEvidenceRequest;
import com.fenxiao.incentive.dto.UserGradePlatinumEvidenceResponse;
import com.fenxiao.relationship.service.RelationshipFoundationService;
import com.fenxiao.user.repository.UserDistributionProfileRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.PreparedStatement;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;

/**
 * Advanced grade reviews are evidence records. They do not assign a legacy role,
 * create a team, enable a profit share, or generate any monetary record until
 * an authorized operator explicitly confirms the final leadership appointment.
 */
@Service
@Transactional
public class UserGradeAdvancementReviewService {
    private static final String MODULE = "user_grade_advancement";
    private final JdbcTemplate jdbc;
    private final OperationAuditLogRepository audits;
    private final UserDistributionProfileRepository users;
    private final RelationshipFoundationService relationships;
    private final Clock clock;

    public UserGradeAdvancementReviewService(JdbcTemplate jdbc, OperationAuditLogRepository audits, UserDistributionProfileRepository users, RelationshipFoundationService relationships, Clock clock) {
        this.jdbc = jdbc; this.audits = audits; this.users = users; this.relationships = relationships; this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<UserGradeAdvancementReviewResponse> recent() {
        return jdbc.query(select() + " order by updated_at desc,id desc limit 100", (rs, row) -> map(rs));
    }

    public UserGradeAdvancementReviewResponse open(UserGradeAdvancementReviewRequest request, AdminSessionService.AdminPrincipal actor) {
        String platform = platform(request.platformCode());
        String guild = required(request.guildId(), "guildId");
        String grade = advancedGrade(request.targetGradeCode());
        List<UserGradeAdvancementReviewResponse> existing = jdbc.query(select() + " where user_id=? and platform_code=? and guild_id=? and target_grade_code=?", (rs, row) -> map(rs), request.userId(), platform, guild, grade);
        if (!existing.isEmpty()) return existing.getFirst();
        KeyHolder keys = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("insert into user_grade_advancement_review(user_id,platform_code,guild_id,target_grade_code,created_by) values(?,?,?,?,?)", new String[]{"id"});
            statement.setLong(1, request.userId()); statement.setString(2, platform); statement.setString(3, guild); statement.setString(4, grade); statement.setLong(5, actor.accountId());
            return statement;
        }, keys);
        UserGradeAdvancementReviewResponse created = requiredReview(Objects.requireNonNull(keys.getKey()).longValue());
        audit(actor, created, "OPEN", null, snapshot(created), "建立高级等级培养与经营验收记录；不会授予负责人身份或产生奖励");
        return created;
    }

    public UserGradeAdvancementReviewResponse confirmTraining(long id, String note, AdminSessionService.AdminPrincipal actor) {
        UserGradeAdvancementReviewResponse review = requiredReview(id);
        assertObjectiveEvidence(review);
        return decide(id, "TRAINING", note, actor);
    }

    public UserGradeAdvancementReviewResponse confirmOperatingValidation(long id, String note, AdminSessionService.AdminPrincipal actor) {
        UserGradeAdvancementReviewResponse review = requiredReview(id);
        assertObjectiveEvidence(review);
        return decide(id, "OPERATING", note, actor);
    }

    /**
     * Records one of Platinum's two required Silver-member cultivation groups.
     * The supplied counts are reviewed operational evidence, never reward input.
     */
    public UserGradeAdvancementReviewResponse recordPlatinumEvidence(long reviewId, UserGradePlatinumEvidenceRequest request, AdminSessionService.AdminPrincipal actor) {
        UserGradeAdvancementReviewResponse before = requiredReview(reviewId);
        if (!"PLATINUM".equals(before.targetGradeCode())) throw new IllegalStateException("structured cultivation evidence is currently required only for PLATINUM");
        if (!"PENDING".equals(before.trainingStatus())) throw new IllegalStateException("platinum cultivation evidence is locked after training confirmation");
        if (request.traineeUserId().longValue() == before.userId()) throw new IllegalArgumentException("trainee must be different from the advancement user");
        LocalDate start = request.observationStart(), end = request.observationEnd();
        if (end.isBefore(start) || ChronoUnit.DAYS.between(start, end) + 1 < 30) throw new IllegalArgumentException("platinum group observation must cover at least 30 calendar days");
        if (request.finalWeekEffectiveUserCount() < 5 || request.finalWeekMinIncomeDateCount() < 3) throw new IllegalArgumentException("platinum evidence requires at least five effective users and three income dates in the final seven days");
        assertSilverQualified(request.traineeUserId(), before.platformCode(), before.guildId());
        String group = required(request.groupReference(), "groupReference");
        String note = required(request.evidenceNote(), "evidenceNote");
        LocalDateTime now = LocalDateTime.now(clock);
        Integer existing = jdbc.queryForObject("select count(*) from user_grade_platinum_training_evidence where advancement_review_id=? and trainee_user_id=?", Integer.class, reviewId, request.traineeUserId());
        if (existing != null && existing > 0) {
            jdbc.update("update user_grade_platinum_training_evidence set group_reference=?,observation_start=?,observation_end=?,final_week_effective_user_count=?,final_week_min_income_date_count=?,evidence_note=?,evidence_status='RECORDED',recorded_by=?,recorded_at=?,confirmed_by=null,confirmed_at=null,updated_at=? where advancement_review_id=? and trainee_user_id=?", group, start, end, request.finalWeekEffectiveUserCount(), request.finalWeekMinIncomeDateCount(), note, actor.accountId(), now, now, reviewId, request.traineeUserId());
        } else {
            jdbc.update("insert into user_grade_platinum_training_evidence(advancement_review_id,trainee_user_id,group_reference,observation_start,observation_end,final_week_effective_user_count,final_week_min_income_date_count,evidence_note,evidence_status,recorded_by,recorded_at,updated_at) values(?,?,?,?,?,?,?,?,'RECORDED',?,?,?)", reviewId, request.traineeUserId(), group, start, end, request.finalWeekEffectiveUserCount(), request.finalWeekMinIncomeDateCount(), note, actor.accountId(), now, now);
        }
        UserGradeAdvancementReviewResponse after = requiredReview(reviewId);
        audit(actor, after, "RECORD_PLATINUM_EVIDENCE", snapshot(before), snapshot(after), "记录银牌培养成员及其 30 天小组经营证据；不会升级、建队或产生奖励");
        return after;
    }

    /**
     * Records objective evidence for Diamond (two complete calendar months) or
     * Black Gold (three complete calendar months).  The evidence note remains an
     * operator-reviewed business conclusion because the operating KPI is not yet
     * defined, while grade, uniqueness and calendar boundaries are enforced here.
     */
    public UserGradeAdvancementReviewResponse recordAdvancedEvidence(long reviewId, UserGradeAdvancedEvidenceRequest request, AdminSessionService.AdminPrincipal actor) {
        UserGradeAdvancementReviewResponse before = requiredReview(reviewId);
        String target = before.targetGradeCode();
        if (!List.of("DIAMOND", "BLACK_GOLD").contains(target)) throw new IllegalStateException("structured advanced evidence is required only for DIAMOND or BLACK_GOLD");
        if (!"PENDING".equals(before.trainingStatus())) throw new IllegalStateException("advanced cultivation evidence is locked after training confirmation");
        if (request.traineeUserId().longValue() == before.userId()) throw new IllegalArgumentException("trainee must be different from the advancement user");
        assertAdvancedPrerequisite(before);
        assertTraineeQualified(request.traineeUserId(), before.platformCode(), before.guildId(), target);

        LocalDate start = request.observationStart(), end = request.observationEnd();
        int requiredMonths = requiredCompleteMonths(target);
        assertCompleteCalendarMonths(start, end, requiredMonths, target);
        String scope = required(request.scopeReference(), "scopeReference");
        String note = required(request.evidenceNote(), "evidenceNote");
        Integer reused = jdbc.queryForObject("""
                select count(*) from user_grade_advanced_training_evidence e
                join user_grade_advancement_review r on r.id=e.advancement_review_id
                where e.trainee_user_id=? and r.target_grade_code=? and e.advancement_review_id<>?
                """, Integer.class, request.traineeUserId(), target, reviewId);
        if (reused != null && reused > 0) throw new IllegalStateException("the same trainee cannot be reused for another " + target + " cultivation review");
        LocalDateTime now = LocalDateTime.now(clock);
        Integer existing = jdbc.queryForObject("select count(*) from user_grade_advanced_training_evidence where advancement_review_id=? and trainee_user_id=?", Integer.class, reviewId, request.traineeUserId());
        if (existing != null && existing > 0) {
            jdbc.update("update user_grade_advanced_training_evidence set scope_reference=?,observation_start=?,observation_end=?,evidence_note=?,evidence_status='RECORDED',recorded_by=?,recorded_at=?,confirmed_by=null,confirmed_at=null,updated_at=? where advancement_review_id=? and trainee_user_id=?", scope, start, end, note, actor.accountId(), now, now, reviewId, request.traineeUserId());
        } else {
            jdbc.update("insert into user_grade_advanced_training_evidence(advancement_review_id,trainee_user_id,scope_reference,observation_start,observation_end,evidence_note,evidence_status,recorded_by,recorded_at,updated_at) values(?,?,?,?,?,?, 'RECORDED',?,?,?)", reviewId, request.traineeUserId(), scope, start, end, note, actor.accountId(), now, now);
        }
        UserGradeAdvancementReviewResponse after = requiredReview(reviewId);
        audit(actor, after, "RECORD_ADVANCED_EVIDENCE", snapshot(before), snapshot(after), "记录" + target + "培养对象与完整自然月经营范围证据；不会创建奖励、余额或付款");
        return after;
    }

    public UserGradeAdvancementReviewResponse confirmResponsibility(long id, String note, AdminSessionService.AdminPrincipal actor) {
        assertObjectiveEvidence(requiredReview(id));
        return decide(id, "RESPONSIBILITY", note, actor);
    }

    public UserGradeAdvancementReviewResponse confirmLeadershipAppointment(long id, String note, AdminSessionService.AdminPrincipal actor) {
        UserGradeAdvancementReviewResponse before = requiredReview(id);
        if (!"READY_FOR_LEADER_CONFIRMATION".equals(before.reviewStatus())) throw new IllegalStateException("training, operating validation and responsibility confirmation are required before leader appointment");
        assertObjectiveEvidence(before);
        String requiredNote = required(note, "note");
        var user = users.findById(before.userId()).orElseThrow(() -> new IllegalArgumentException("user not found"));
        Integer goldQualified = jdbc.queryForObject("select count(*) from user_grade_evaluation where user_id=? and platform_code=? and guild_id=? and grade_code='GOLD' and qualification_status='QUALIFIED'", Integer.class, before.userId(), before.platformCode(), before.guildId());
        if (goldQualified == null || goldQualified == 0) throw new IllegalStateException("a qualified GOLD grade is required before formal leader appointment");
        var team = relationships.confirmAdvancedGradeLeadership(user, before.targetGradeCode());
        LocalDateTime now = LocalDateTime.now(clock);
        jdbc.update("update user_grade_advancement_review set review_status='LEADER_CONFIRMED',responsibility_note=concat(responsibility_note,' | appointment: ',?),updated_at=? where id=?", requiredNote, now, id);
        UserGradeAdvancementReviewResponse after = requiredReview(id);
        audit(actor, after, "CONFIRM_LEADER_APPOINTMENT", snapshot(before), snapshot(after), "已确认团队负责人并绑定团队 " + team.getTeamCode() + "；团队经营分成仍保持关闭");
        return after;
    }

    private UserGradeAdvancementReviewResponse decide(long id, String decision, String note, AdminSessionService.AdminPrincipal actor) {
        UserGradeAdvancementReviewResponse before = requiredReview(id);
        String requiredNote = required(note, "note");
        LocalDateTime now = LocalDateTime.now(clock);
        switch (decision) {
            case "TRAINING" -> jdbc.update("update user_grade_advancement_review set training_status='CONFIRMED',training_note=?,training_verified_by=?,training_verified_at=?,updated_at=? where id=?", requiredNote, actor.accountId(), now, now, id);
            case "OPERATING" -> jdbc.update("update user_grade_advancement_review set operating_validation_status='CONFIRMED',operating_validation_note=?,operating_verified_by=?,operating_verified_at=?,updated_at=? where id=?", requiredNote, actor.accountId(), now, now, id);
            case "RESPONSIBILITY" -> jdbc.update("update user_grade_advancement_review set responsibility_status='CONFIRMED',responsibility_note=?,responsibility_confirmed_by=?,responsibility_confirmed_at=?,updated_at=? where id=?", requiredNote, actor.accountId(), now, now, id);
            default -> throw new IllegalArgumentException("unsupported decision");
        }
        if ("TRAINING".equals(decision) && "PLATINUM".equals(before.targetGradeCode())) {
            jdbc.update("update user_grade_platinum_training_evidence set evidence_status='CONFIRMED',confirmed_by=?,confirmed_at=?,updated_at=? where advancement_review_id=?", actor.accountId(), now, now, id);
        }
        if ("TRAINING".equals(decision) && List.of("DIAMOND", "BLACK_GOLD").contains(before.targetGradeCode())) {
            jdbc.update("update user_grade_advanced_training_evidence set evidence_status='CONFIRMED',confirmed_by=?,confirmed_at=?,updated_at=? where advancement_review_id=?", actor.accountId(), now, now, id);
        }
        UserGradeAdvancementReviewResponse after = requiredReview(id);
        if ("CONFIRMED".equals(after.trainingStatus()) && "CONFIRMED".equals(after.operatingValidationStatus()) && "CONFIRMED".equals(after.responsibilityStatus())) {
            jdbc.update("update user_grade_advancement_review set review_status='READY_FOR_LEADER_CONFIRMATION',updated_at=? where id=?", now, id);
            after = requiredReview(id);
        }
        audit(actor, after, "CONFIRM_" + decision, snapshot(before), snapshot(after), "仅记录培养、经营验收或经营职责确认；不自动创建团队或开启团队经营分成");
        return after;
    }

    private void assertGoldQualified(UserGradeAdvancementReviewResponse review) {
        Integer count = jdbc.queryForObject("select count(*) from user_grade_evaluation where user_id=? and platform_code=? and guild_id=? and grade_code='GOLD' and qualification_status='QUALIFIED'", Integer.class, review.userId(), review.platformCode(), review.guildId());
        if (count == null || count == 0) throw new IllegalStateException("a qualified GOLD grade is required before Platinum evidence can be confirmed");
    }

    private void assertObjectiveEvidence(UserGradeAdvancementReviewResponse review) {
        switch (review.targetGradeCode()) {
            case "PLATINUM" -> { assertGoldQualified(review); assertPlatinumEvidence(review); }
            case "DIAMOND", "BLACK_GOLD" -> { assertAdvancedPrerequisite(review); assertAdvancedEvidence(review); }
            default -> throw new IllegalStateException("unsupported advanced grade review");
        }
    }

    private void assertAdvancedPrerequisite(UserGradeAdvancementReviewResponse review) {
        String prerequisite = "DIAMOND".equals(review.targetGradeCode()) ? "PLATINUM" : "DIAMOND";
        assertConfirmedAdvancedReview(review.userId(), review.platformCode(), review.guildId(), prerequisite, "before " + review.targetGradeCode() + " evidence can be confirmed");
    }

    private void assertTraineeQualified(long userId, String platform, String guild, String target) {
        if ("DIAMOND".equals(target)) {
            Integer gold = jdbc.queryForObject("select count(*) from user_grade_evaluation where user_id=? and platform_code=? and guild_id=? and grade_code='GOLD' and qualification_status='QUALIFIED'", Integer.class, userId, platform, guild);
            if (gold == null || gold == 0) throw new IllegalStateException("each Diamond trainee must have a qualified GOLD grade in the same platform and guild");
            return;
        }
        assertConfirmedAdvancedReview(userId, platform, guild, "DIAMOND", "for each Black Gold trainee");
    }

    /** A Diamond record created before V60 cannot be reused until its two objective evidence rows are present. */
    private void assertConfirmedAdvancedReview(long userId, String platform, String guild, String grade, String context) {
        Integer count = jdbc.queryForObject("""
                select count(*) from user_grade_advancement_review r
                where r.user_id=? and r.platform_code=? and r.guild_id=? and r.target_grade_code=? and r.review_status='LEADER_CONFIRMED'
                  and (? <> 'DIAMOND' or (select count(*) from user_grade_advanced_training_evidence e where e.advancement_review_id=r.id and e.evidence_status='CONFIRMED')=2)
                """, Integer.class, userId, platform, guild, grade, grade);
        if (count == null || count == 0) throw new IllegalStateException("a confirmed " + grade + " review is required " + context);
    }

    private void assertAdvancedEvidence(UserGradeAdvancementReviewResponse review) {
        List<UserGradeAdvancedEvidenceResponse> evidence = advancedEvidence(review.id());
        if (evidence.size() != 2) throw new IllegalStateException(review.targetGradeCode() + " requires exactly two independently recorded cultivation records");
        int requiredMonths = requiredCompleteMonths(review.targetGradeCode());
        for (UserGradeAdvancedEvidenceResponse item : evidence) {
            assertTraineeQualified(item.traineeUserId(), review.platformCode(), review.guildId(), review.targetGradeCode());
            assertCompleteCalendarMonths(item.observationStart(), item.observationEnd(), requiredMonths, review.targetGradeCode());
        }
    }

    private int requiredCompleteMonths(String target) { return "DIAMOND".equals(target) ? 2 : 3; }

    private void assertCompleteCalendarMonths(LocalDate start, LocalDate end, int requiredMonths, String target) {
        if (end.isBefore(start) || start.getDayOfMonth() != 1 || end.getDayOfMonth() != end.lengthOfMonth()) {
            throw new IllegalArgumentException(target + " observation must start on the first day and end on the last day of a calendar month");
        }
        LocalDate earliestEnd = start.plusMonths(requiredMonths).minusDays(1);
        if (end.isBefore(earliestEnd)) throw new IllegalArgumentException(target + " observation must cover at least " + requiredMonths + " complete consecutive calendar months");
        if (end.isAfter(LocalDate.now(clock))) throw new IllegalArgumentException(target + " observation cannot end in the future");
    }

    private void assertSilverQualified(long userId, String platform, String guild) {
        Integer count = jdbc.queryForObject("select count(*) from user_grade_evaluation where user_id=? and platform_code=? and guild_id=? and grade_code='SILVER' and qualification_status='QUALIFIED'", Integer.class, userId, platform, guild);
        if (count == null || count == 0) throw new IllegalStateException("each Platinum trainee must have a qualified SILVER grade in the same platform and guild");
    }

    private void assertPlatinumEvidence(UserGradeAdvancementReviewResponse review) {
        List<UserGradePlatinumEvidenceResponse> evidence = evidence(review.id());
        if (evidence.size() != 2) throw new IllegalStateException("Platinum requires exactly two independently recorded Silver-member cultivation groups");
        for (UserGradePlatinumEvidenceResponse item : evidence) {
            assertSilverQualified(item.traineeUserId(), review.platformCode(), review.guildId());
            if (ChronoUnit.DAYS.between(item.observationStart(), item.observationEnd()) + 1 < 30 || item.finalWeekEffectiveUserCount() < 5 || item.finalWeekMinIncomeDateCount() < 3) {
                throw new IllegalStateException("Platinum group evidence does not satisfy the confirmed 30-day and final-seven-day thresholds");
            }
        }
    }

    private UserGradeAdvancementReviewResponse requiredReview(long id) {
        List<UserGradeAdvancementReviewResponse> values = jdbc.query(select() + " where id=?", (rs, row) -> map(rs), id);
        if (values.isEmpty()) throw new IllegalArgumentException("grade advancement review not found");
        return values.getFirst();
    }

    private String select() { return "select id,user_id,platform_code,guild_id,target_grade_code,training_status,training_note,training_verified_by,training_verified_at,operating_validation_status,operating_validation_note,operating_verified_by,operating_verified_at,responsibility_status,responsibility_note,responsibility_confirmed_by,responsibility_confirmed_at,review_status,created_by,created_at,updated_at from user_grade_advancement_review"; }
    private UserGradeAdvancementReviewResponse map(java.sql.ResultSet rs) throws java.sql.SQLException { long reviewId = rs.getLong(1); return new UserGradeAdvancementReviewResponse(reviewId,rs.getLong(2),rs.getString(3),rs.getString(4),rs.getString(5),rs.getString(6),rs.getString(7),nullableLong(rs,8),time(rs,9),rs.getString(10),rs.getString(11),nullableLong(rs,12),time(rs,13),rs.getString(14),rs.getString(15),nullableLong(rs,16),time(rs,17),rs.getString(18),nullableLong(rs,19),time(rs,20),time(rs,21),evidence(reviewId),advancedEvidence(reviewId)); }
    private List<UserGradePlatinumEvidenceResponse> evidence(long reviewId) { return jdbc.query("select id,trainee_user_id,group_reference,observation_start,observation_end,final_week_effective_user_count,final_week_min_income_date_count,evidence_note,evidence_status,recorded_by,recorded_at,confirmed_by,confirmed_at from user_grade_platinum_training_evidence where advancement_review_id=? order by id", (rs, row) -> new UserGradePlatinumEvidenceResponse(rs.getLong(1),rs.getLong(2),rs.getString(3),rs.getDate(4).toLocalDate(),rs.getDate(5).toLocalDate(),rs.getInt(6),rs.getInt(7),rs.getString(8),rs.getString(9),nullableLong(rs,10),time(rs,11),nullableLong(rs,12),time(rs,13)), reviewId); }
    private List<UserGradeAdvancedEvidenceResponse> advancedEvidence(long reviewId) { return jdbc.query("select id,trainee_user_id,scope_reference,observation_start,observation_end,evidence_note,evidence_status,recorded_by,recorded_at,confirmed_by,confirmed_at from user_grade_advanced_training_evidence where advancement_review_id=? order by id", (rs, row) -> new UserGradeAdvancedEvidenceResponse(rs.getLong(1),rs.getLong(2),rs.getString(3),rs.getDate(4).toLocalDate(),rs.getDate(5).toLocalDate(),rs.getString(6),rs.getString(7),nullableLong(rs,8),time(rs,9),nullableLong(rs,10),time(rs,11)), reviewId); }
    private LocalDateTime time(java.sql.ResultSet rs, int index) throws java.sql.SQLException { return rs.getTimestamp(index) == null ? null : rs.getTimestamp(index).toLocalDateTime(); }
    private Long nullableLong(java.sql.ResultSet rs, int index) throws java.sql.SQLException { long value = rs.getLong(index); return rs.wasNull() ? null : value; }
    private String advancedGrade(String value) { String grade = required(value, "targetGradeCode").toUpperCase(Locale.ROOT); if (!List.of("PLATINUM", "DIAMOND", "BLACK_GOLD").contains(grade)) throw new IllegalArgumentException("targetGradeCode must be PLATINUM, DIAMOND or BLACK_GOLD"); return grade; }
    private String platform(String value) { String platform = required(value, "platformCode").toUpperCase(Locale.ROOT); if (!List.of("TIMO", "LINKY").contains(platform)) throw new IllegalArgumentException("unsupported platform"); return platform; }
    private String required(String value, String field) { if (value == null || value.isBlank()) throw new IllegalArgumentException(field + " is required"); return value.trim(); }
    private void audit(AdminSessionService.AdminPrincipal actor, UserGradeAdvancementReviewResponse review, String action, String before, String after, String remark) { audits.save(OperationAuditLog.create(actor.accountId(), actor.role(), MODULE, "user_grade_advancement_review", review.id(), action, before, after, UUID.randomUUID().toString(), remark, LocalDateTime.now(clock))); }
    private String snapshot(UserGradeAdvancementReviewResponse value) { return "user=" + value.userId() + ";scope=" + value.platformCode() + "/" + value.guildId() + ";grade=" + value.targetGradeCode() + ";training=" + value.trainingStatus() + ";operating=" + value.operatingValidationStatus() + ";responsibility=" + value.responsibilityStatus(); }
}
