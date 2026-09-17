package com.fenxiao.incentive.service;

import com.fenxiao.admin.service.AdminSessionService;
import com.fenxiao.audit.entity.OperationAuditLog;
import com.fenxiao.audit.repository.OperationAuditLogRepository;
import com.fenxiao.incentive.dto.UserGradeLevelDashboardResponse;
import com.fenxiao.incentive.dto.UserGradeLevelRequest;
import com.fenxiao.incentive.dto.UserGradeLevelResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;

/** Governance of point-based user levels. Point acquisition and grade evaluation are intentionally separate. */
@Service
@Transactional
public class UserGradeLevelAdminService {
    private static final String MODULE = "user_grade_level";
    private final JdbcTemplate jdbc;
    private final OperationAuditLogRepository audits;
    private final Clock clock;

    public UserGradeLevelAdminService(JdbcTemplate jdbc, OperationAuditLogRepository audits, Clock clock) {
        this.jdbc = jdbc;
        this.audits = audits;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public UserGradeLevelDashboardResponse dashboard() {
        List<UserGradeLevelResponse> levels = levels();
        UserGradeLevelResponse teamLeader = levels.stream()
                .filter(value -> "ACTIVE".equals(value.status()) && value.grantsTeamLeader())
                .findFirst().orElse(null);
        return new UserGradeLevelDashboardResponse(
                levels.stream().filter(value -> "ACTIVE".equals(value.status())).count(), teamLeader, levels);
    }

    @Transactional(readOnly = true)
    public List<UserGradeLevelResponse> levels() {
        return jdbc.query(select() + " order by level_rank asc,effective_from desc,id desc", (rs, row) -> map(rs));
    }

    public UserGradeLevelResponse createDraft(UserGradeLevelRequest request, AdminSessionService.AdminPrincipal actor) {
        validate(request);
        String code = "UGL-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase(Locale.ROOT);
        KeyHolder keys = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(
                    "insert into user_grade_level_version(level_code,level_version,level_name,level_rank,required_points,grants_team_leader,effective_from,effective_to,rule_status,created_by) values(?,1,?,?,?,?,?,?,'DRAFT',?)",
                    new String[]{"id"});
            statement.setString(1, code);
            statement.setString(2, request.levelName().trim());
            statement.setInt(3, request.levelRank());
            statement.setBigDecimal(4, request.requiredPoints());
            statement.setBoolean(5, request.grantsTeamLeader());
            statement.setObject(6, request.effectiveFrom());
            statement.setObject(7, request.effectiveTo());
            statement.setLong(8, actor.accountId());
            return statement;
        }, keys);
        UserGradeLevelResponse created = level(Objects.requireNonNull(keys.getKey()).longValue());
        audit(actor, created.id(), "CREATE_DRAFT", null, snapshot(created), "建立积分等级草稿；积分来源尚未接通，不会改变用户等级或团队负责人身份");
        return created;
    }

    public UserGradeLevelResponse activate(long id, String note, AdminSessionService.AdminPrincipal actor) {
        UserGradeLevelResponse current = level(id);
        if (!"DRAFT".equals(current.status())) throw new IllegalStateException("only draft user grade level can be activated");
        ensureNoOverlap(current);
        jdbc.update("update user_grade_level_version set rule_status='ACTIVE',approved_by=?,approved_at=?,approval_note=? where id=?",
                actor.accountId(), LocalDateTime.now(clock), required(note, "approvalNote"), id);
        UserGradeLevelResponse updated = level(id);
        audit(actor, id, "ACTIVATE", snapshot(current), snapshot(updated), "审批启用积分等级；仅作为后续积分评估门槛，不会立即创建团队或发放奖励");
        return updated;
    }

    public UserGradeLevelResponse retire(long id, AdminSessionService.AdminPrincipal actor) {
        UserGradeLevelResponse current = level(id);
        if (!"ACTIVE".equals(current.status())) throw new IllegalStateException("only active user grade level can be retired");
        jdbc.update("update user_grade_level_version set rule_status='RETIRED',effective_to=coalesce(effective_to,?) where id=?", LocalDateTime.now(clock), id);
        UserGradeLevelResponse updated = level(id);
        audit(actor, id, "RETIRE", snapshot(current), snapshot(updated), "停止积分等级；不会自动降级、撤销负责人或删除团队关系");
        return updated;
    }

    private void ensureNoOverlap(UserGradeLevelResponse candidate) {
        for (UserGradeLevelResponse other : levels()) {
            if (other.id() == candidate.id() || !"ACTIVE".equals(other.status())) continue;
            boolean overlapping = (other.effectiveTo() == null || !candidate.effectiveFrom().isAfter(other.effectiveTo()))
                    && (candidate.effectiveTo() == null || !other.effectiveFrom().isAfter(candidate.effectiveTo()));
            if (!overlapping) continue;
            if (other.levelRank() == candidate.levelRank()) throw new IllegalStateException("an active user grade level already overlaps this level rank");
            if (other.grantsTeamLeader() && candidate.grantsTeamLeader()) throw new IllegalStateException("an active team leader grade already exists");
        }
    }

    private void validate(UserGradeLevelRequest request) {
        if (request.levelName() == null || request.levelName().isBlank() || request.levelName().trim().length() > 64) throw new IllegalArgumentException("levelName is required and must be within 64 characters");
        if (request.requiredPoints() == null || request.requiredPoints().compareTo(BigDecimal.ZERO) < 0) throw new IllegalArgumentException("requiredPoints must not be negative");
        if (request.effectiveTo() != null && request.effectiveTo().isBefore(request.effectiveFrom())) throw new IllegalArgumentException("effectiveTo must not be before effectiveFrom");
    }

    private UserGradeLevelResponse level(long id) {
        List<UserGradeLevelResponse> values = jdbc.query(select() + " where id=?", (rs, row) -> map(rs), id);
        if (values.isEmpty()) throw new IllegalArgumentException("user grade level not found");
        return values.getFirst();
    }

    private String select() {
        return "select id,level_code,level_version,level_name,level_rank,required_points,grants_team_leader,effective_from,effective_to,rule_status,created_by,approved_by,approved_at,approval_note from user_grade_level_version";
    }

    private UserGradeLevelResponse map(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new UserGradeLevelResponse(rs.getLong(1), rs.getString(2), rs.getInt(3), rs.getString(4), rs.getInt(5), rs.getBigDecimal(6), rs.getBoolean(7),
                rs.getTimestamp(8).toLocalDateTime(), rs.getTimestamp(9) == null ? null : rs.getTimestamp(9).toLocalDateTime(), rs.getString(10),
                nullableLong(rs, 11), nullableLong(rs, 12), rs.getTimestamp(13) == null ? null : rs.getTimestamp(13).toLocalDateTime(), rs.getString(14));
    }

    private Long nullableLong(java.sql.ResultSet rs, int index) throws java.sql.SQLException {
        long value = rs.getLong(index);
        return rs.wasNull() ? null : value;
    }

    private void audit(AdminSessionService.AdminPrincipal actor, long id, String action, String before, String after, String remark) {
        audits.save(OperationAuditLog.create(actor.accountId(), actor.role(), MODULE, "user_grade_level", id, action, before, after, null, remark, LocalDateTime.now(clock)));
    }

    private String snapshot(UserGradeLevelResponse value) {
        return "code=" + value.levelCode() + ";rank=" + value.levelRank() + ";requiredPoints=" + value.requiredPoints() + ";teamLeader=" + value.grantsTeamLeader() + ";status=" + value.status();
    }

    private String required(String value, String field) {
        if (value == null || value.isBlank()) throw new IllegalArgumentException(field + " is required");
        return value.trim();
    }
}
