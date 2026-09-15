package com.fenxiao.incentive.service;

import com.fenxiao.admin.service.AdminSessionService;
import com.fenxiao.audit.entity.OperationAuditLog;
import com.fenxiao.audit.repository.OperationAuditLogRepository;
import com.fenxiao.incentive.dto.*;
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

/** Administrative workflow for mentor incentives. No method writes rewards, balances or payments. */
@Service
@Transactional
public class MentorIncentiveAdminService {
    private static final String MODULE = "mentor_incentive";
    private final JdbcTemplate jdbc;
    private final OperationAuditLogRepository audits;
    private final Clock clock;

    public MentorIncentiveAdminService(JdbcTemplate jdbc, OperationAuditLogRepository audits, Clock clock) {
        this.jdbc = jdbc;
        this.audits = audits;
        this.clock = clock;
    }

    public MentorIncentiveDashboardResponse dashboard() {
        return new MentorIncentiveDashboardResponse(
                count("select count(*) from mentor_profile where qualification_status='QUALIFIED'"),
                count("select count(*) from mentor_assignment_version where assignment_status='ASSIGNED' and effective_to is null"),
                count("select count(*) from incentive_shadow_ledger where reward_type='MENTOR'"),
                mentors(),
                rules(),
                jdbc.query("select l.id,l.recipient_user_id,l.source_user_id,l.platform_code,l.milestone_code,r.rule_code,l.rule_version,l.amount_minor,l.currency_code,l.ledger_status,l.triggered_at " +
                                "from incentive_shadow_ledger l join incentive_rule_version r on r.id=l.rule_id where l.reward_type='MENTOR' order by l.triggered_at desc,l.id desc limit 20",
                        (rs, row) -> new MentorShadowLedgerItemResponse(rs.getLong(1), rs.getLong(2), rs.getLong(3), rs.getString(4), rs.getString(5), rs.getString(6), rs.getInt(7), rs.getLong(8), rs.getString(9), rs.getString(10), rs.getTimestamp(11).toLocalDateTime())));
    }

    private List<MentorDirectoryItemResponse> mentors() {
        return jdbc.query("select m.user_id,p.phone_number,m.country_code,m.language_code,m.qualification_status,m.max_active_students,coalesce(a.assigned_student_count,0) " +
                        "from mentor_profile m left join user_distribution_profile p on p.user_id=m.user_id " +
                        "left join (select mentor_user_id,count(*) assigned_student_count from mentor_assignment_version where assignment_status='ASSIGNED' and effective_to is null group by mentor_user_id) a on a.mentor_user_id=m.user_id " +
                        "where m.qualification_status='QUALIFIED' order by m.user_id asc",
                (rs, row) -> new MentorDirectoryItemResponse(rs.getLong(1), rs.getString(2), rs.getString(3), rs.getString(4), rs.getString(5), rs.getInt(6), rs.getLong(7)));
    }

    public List<MentorIncentiveRuleResponse> rules() {
        return jdbc.query("select id,rule_code,rule_version,milestone_code,platform_code,country_code,guild_id,amount_minor,currency_code,freeze_days,effective_from,effective_to,rule_status,created_by,approved_by,approved_at,approval_note " +
                        "from incentive_rule_version where reward_type='MENTOR' order by effective_from desc,id desc",
                (rs, row) -> new MentorIncentiveRuleResponse(rs.getLong(1), rs.getString(2), rs.getInt(3), rs.getString(4), rs.getString(5), rs.getString(6), rs.getString(7), rs.getLong(8), rs.getString(9), rs.getInt(10), rs.getTimestamp(11).toLocalDateTime(), rs.getTimestamp(12) == null ? null : rs.getTimestamp(12).toLocalDateTime(), rs.getString(13), nullableLong(rs, 14), nullableLong(rs, 15), rs.getTimestamp(16) == null ? null : rs.getTimestamp(16).toLocalDateTime(), rs.getString(17)));
    }

    public MentorIncentiveRuleResponse createDraft(MentorIncentiveRuleRequest request, AdminSessionService.AdminPrincipal actor) {
        validate(request);
        LocalDateTime effectiveFrom = request.effectiveFrom() == null ? LocalDateTime.now(clock) : request.effectiveFrom();
        String code = "MR-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase(Locale.ROOT);
        KeyHolder keys = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("insert into incentive_rule_version(rule_code,rule_version,reward_type,milestone_code,platform_code,country_code,guild_id,amount_minor,currency_code,freeze_days,effective_from,effective_to,enabled,rule_status,created_by) values(?,1,'MENTOR',?,?,?,?,?,?,?,?,?,false,'DRAFT',?)", new String[]{"id"});
            statement.setString(1, code); statement.setString(2, upper(request.milestoneCode())); statement.setString(3, platform(request.platformCode())); statement.setString(4, upper(request.countryCode())); statement.setString(5, nullable(request.guildId()));
            statement.setLong(6, request.amountMinor()); statement.setString(7, upper(request.currencyCode())); statement.setInt(8, request.freezeDays()); statement.setObject(9, effectiveFrom); statement.setObject(10, request.effectiveTo()); statement.setLong(11, actor.accountId());
            return statement;
        }, keys);
        long id = Objects.requireNonNull(keys.getKey()).longValue();
        MentorIncentiveRuleResponse response = rule(id);
        audit(actor, id, "CREATE_DRAFT", null, snapshot(response), "建立导师里程碑奖励草稿；仅影子账本");
        return response;
    }

    public MentorIncentiveRuleResponse activate(long id, String note, AdminSessionService.AdminPrincipal actor) {
        MentorIncentiveRuleResponse current = rule(id);
        if (!"DRAFT".equals(current.status())) throw new IllegalStateException("only draft mentor rule can be activated");
        ensureNoOverlap(current);
        jdbc.update("update incentive_rule_version set enabled=true,rule_status='ACTIVE',approved_by=?,approved_at=?,approval_note=? where id=?", actor.accountId(), LocalDateTime.now(clock), note.trim(), id);
        MentorIncentiveRuleResponse updated = rule(id);
        audit(actor, id, "ACTIVATE", snapshot(current), snapshot(updated), "审批启用导师影子规则；不会产生奖励或付款");
        return updated;
    }

    public MentorIncentiveRuleResponse retire(long id, AdminSessionService.AdminPrincipal actor) {
        MentorIncentiveRuleResponse current = rule(id);
        if (!"ACTIVE".equals(current.status())) throw new IllegalStateException("only active mentor rule can be retired");
        jdbc.update("update incentive_rule_version set enabled=false,rule_status='RETIRED',effective_to=coalesce(effective_to,?) where id=?", LocalDateTime.now(clock), id);
        MentorIncentiveRuleResponse updated = rule(id);
        audit(actor, id, "RETIRE", snapshot(current), snapshot(updated), "停止导师影子规则；不会改写历史影子账本");
        return updated;
    }

    private MentorIncentiveRuleResponse rule(long id) {
        List<MentorIncentiveRuleResponse> values = jdbc.query("select id,rule_code,rule_version,milestone_code,platform_code,country_code,guild_id,amount_minor,currency_code,freeze_days,effective_from,effective_to,rule_status,created_by,approved_by,approved_at,approval_note from incentive_rule_version where id=? and reward_type='MENTOR'", (rs, row) -> new MentorIncentiveRuleResponse(rs.getLong(1), rs.getString(2), rs.getInt(3), rs.getString(4), rs.getString(5), rs.getString(6), rs.getString(7), rs.getLong(8), rs.getString(9), rs.getInt(10), rs.getTimestamp(11).toLocalDateTime(), rs.getTimestamp(12) == null ? null : rs.getTimestamp(12).toLocalDateTime(), rs.getString(13), nullableLong(rs, 14), nullableLong(rs, 15), rs.getTimestamp(16) == null ? null : rs.getTimestamp(16).toLocalDateTime(), rs.getString(17)), id);
        if (values.isEmpty()) throw new IllegalArgumentException("mentor incentive rule not found");
        return values.get(0);
    }

    private void ensureNoOverlap(MentorIncentiveRuleResponse candidate) {
        for (MentorIncentiveRuleResponse other : rules()) {
            if (other.id() == candidate.id() || !"ACTIVE".equals(other.status())) continue;
            if (!other.milestoneCode().equals(candidate.milestoneCode()) || !other.platformCode().equals(candidate.platformCode()) || !other.countryCode().equals(candidate.countryCode()) || !Objects.equals(other.guildId(), candidate.guildId())) continue;
            boolean startsBeforeOtherEnds = other.effectiveTo() == null || !candidate.effectiveFrom().isAfter(other.effectiveTo());
            boolean otherStartsBeforeCandidateEnds = candidate.effectiveTo() == null || !other.effectiveFrom().isAfter(candidate.effectiveTo());
            if (startsBeforeOtherEnds && otherStartsBeforeCandidateEnds) throw new IllegalStateException("an active mentor rule already overlaps this milestone and scope");
        }
    }
    private void validate(MentorIncentiveRuleRequest request) {
        if (request.effectiveTo() != null && request.effectiveFrom() != null && request.effectiveTo().isBefore(request.effectiveFrom())) throw new IllegalArgumentException("effectiveTo must not be before effectiveFrom");
        platform(request.platformCode()); upper(request.milestoneCode()); upper(request.countryCode()); upper(request.currencyCode());
    }
    private long count(String sql) { Long value = jdbc.queryForObject(sql, Long.class); return value == null ? 0 : value; }
    private Long nullableLong(java.sql.ResultSet rs, int index) throws java.sql.SQLException { long value = rs.getLong(index); return rs.wasNull() ? null : value; }
    private void audit(AdminSessionService.AdminPrincipal actor, long id, String action, String before, String after, String remark) { audits.save(OperationAuditLog.create(actor.accountId(), actor.role(), MODULE, "mentor_incentive_rule", id, action, before, after, null, remark, LocalDateTime.now(clock))); }
    private String snapshot(MentorIncentiveRuleResponse value) { return String.format(Locale.ROOT, "code=%s,milestone=%s,scope=%s/%s/%s,amount=%d %s,freeze=%d,status=%s,effective=%s..%s", value.ruleCode(), value.milestoneCode(), value.platformCode(), value.countryCode(), value.guildId(), value.amountMinor(), value.currencyCode(), value.freezeDays(), value.status(), value.effectiveFrom(), value.effectiveTo()); }
    private String upper(String value) { if (value == null || value.isBlank()) throw new IllegalArgumentException("value is required"); return value.trim().toUpperCase(Locale.ROOT); }
    private String platform(String value) { String normalized = upper(value); if (!"TIMO".equals(normalized) && !"LINKY".equals(normalized)) throw new IllegalArgumentException("mentor platform must be TIMO or LINKY"); return normalized; }
    private String nullable(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
