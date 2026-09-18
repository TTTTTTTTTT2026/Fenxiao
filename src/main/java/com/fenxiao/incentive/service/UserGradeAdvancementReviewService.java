package com.fenxiao.incentive.service;

import com.fenxiao.admin.service.AdminSessionService;
import com.fenxiao.audit.entity.OperationAuditLog;
import com.fenxiao.audit.repository.OperationAuditLogRepository;
import com.fenxiao.incentive.dto.UserGradeAdvancementReviewRequest;
import com.fenxiao.incentive.dto.UserGradeAdvancementReviewResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.PreparedStatement;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;

/**
 * Advanced grade reviews are evidence records. They do not assign a legacy role,
 * create a team, enable a profit share, or generate any monetary record.
 */
@Service
@Transactional
public class UserGradeAdvancementReviewService {
    private static final String MODULE = "user_grade_advancement";
    private final JdbcTemplate jdbc;
    private final OperationAuditLogRepository audits;
    private final Clock clock;

    public UserGradeAdvancementReviewService(JdbcTemplate jdbc, OperationAuditLogRepository audits, Clock clock) {
        this.jdbc = jdbc; this.audits = audits; this.clock = clock;
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
        return decide(id, "TRAINING", note, actor);
    }

    public UserGradeAdvancementReviewResponse confirmOperatingValidation(long id, String note, AdminSessionService.AdminPrincipal actor) {
        return decide(id, "OPERATING", note, actor);
    }

    public UserGradeAdvancementReviewResponse confirmResponsibility(long id, String note, AdminSessionService.AdminPrincipal actor) {
        return decide(id, "RESPONSIBILITY", note, actor);
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
        UserGradeAdvancementReviewResponse after = requiredReview(id);
        if ("CONFIRMED".equals(after.trainingStatus()) && "CONFIRMED".equals(after.operatingValidationStatus()) && "CONFIRMED".equals(after.responsibilityStatus())) {
            jdbc.update("update user_grade_advancement_review set review_status='READY_FOR_LEADER_CONFIRMATION',updated_at=? where id=?", now, id);
            after = requiredReview(id);
        }
        audit(actor, after, "CONFIRM_" + decision, snapshot(before), snapshot(after), "仅记录培养、经营验收或经营职责确认；不自动创建团队或开启团队经营分成");
        return after;
    }

    private UserGradeAdvancementReviewResponse requiredReview(long id) {
        List<UserGradeAdvancementReviewResponse> values = jdbc.query(select() + " where id=?", (rs, row) -> map(rs), id);
        if (values.isEmpty()) throw new IllegalArgumentException("grade advancement review not found");
        return values.getFirst();
    }

    private String select() { return "select id,user_id,platform_code,guild_id,target_grade_code,training_status,training_note,training_verified_by,training_verified_at,operating_validation_status,operating_validation_note,operating_verified_by,operating_verified_at,responsibility_status,responsibility_note,responsibility_confirmed_by,responsibility_confirmed_at,review_status,created_by,created_at,updated_at from user_grade_advancement_review"; }
    private UserGradeAdvancementReviewResponse map(java.sql.ResultSet rs) throws java.sql.SQLException { return new UserGradeAdvancementReviewResponse(rs.getLong(1),rs.getLong(2),rs.getString(3),rs.getString(4),rs.getString(5),rs.getString(6),rs.getString(7),nullableLong(rs,8),time(rs,9),rs.getString(10),rs.getString(11),nullableLong(rs,12),time(rs,13),rs.getString(14),rs.getString(15),nullableLong(rs,16),time(rs,17),rs.getString(18),nullableLong(rs,19),time(rs,20),time(rs,21)); }
    private LocalDateTime time(java.sql.ResultSet rs, int index) throws java.sql.SQLException { return rs.getTimestamp(index) == null ? null : rs.getTimestamp(index).toLocalDateTime(); }
    private Long nullableLong(java.sql.ResultSet rs, int index) throws java.sql.SQLException { long value = rs.getLong(index); return rs.wasNull() ? null : value; }
    private String advancedGrade(String value) { String grade = required(value, "targetGradeCode").toUpperCase(Locale.ROOT); if (!List.of("PLATINUM", "DIAMOND", "BLACK_GOLD").contains(grade)) throw new IllegalArgumentException("targetGradeCode must be PLATINUM, DIAMOND or BLACK_GOLD"); return grade; }
    private String platform(String value) { String platform = required(value, "platformCode").toUpperCase(Locale.ROOT); if (!List.of("TIMO", "LINKY").contains(platform)) throw new IllegalArgumentException("unsupported platform"); return platform; }
    private String required(String value, String field) { if (value == null || value.isBlank()) throw new IllegalArgumentException(field + " is required"); return value.trim(); }
    private void audit(AdminSessionService.AdminPrincipal actor, UserGradeAdvancementReviewResponse review, String action, String before, String after, String remark) { audits.save(OperationAuditLog.create(actor.accountId(), actor.role(), MODULE, "user_grade_advancement_review", review.id(), action, before, after, UUID.randomUUID().toString(), remark, LocalDateTime.now(clock))); }
    private String snapshot(UserGradeAdvancementReviewResponse value) { return "user=" + value.userId() + ";scope=" + value.platformCode() + "/" + value.guildId() + ";grade=" + value.targetGradeCode() + ";training=" + value.trainingStatus() + ";operating=" + value.operatingValidationStatus() + ";responsibility=" + value.responsibilityStatus(); }
}
