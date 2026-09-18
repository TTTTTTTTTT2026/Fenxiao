package com.fenxiao.incentive.service;

import com.fenxiao.admin.service.AdminSessionService;
import com.fenxiao.audit.entity.OperationAuditLog;
import com.fenxiao.audit.repository.OperationAuditLogRepository;
import com.fenxiao.incentive.dto.*;
import com.fenxiao.platform.entity.PlatformGuildDirectory;
import com.fenxiao.platform.repository.PlatformAccountBindingRepository;
import com.fenxiao.platform.repository.PlatformGuildDirectoryRepository;
import com.fenxiao.relationship.service.RelationshipFoundationService;
import com.fenxiao.user.entity.UserDistributionProfile;
import com.fenxiao.user.repository.UserDistributionProfileRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Grade authority is local: the metrics are direct-invite relations plus MCN BOUND_FINAL income facts.
 * It has no reward, balance, withdrawal or payment side effect.
 */
@Service
@Transactional
public class UserGradeAdminService {
    private static final String MODULE = "user_grade";
    private final JdbcTemplate jdbc;
    private final OperationAuditLogRepository audits;
    private final UserDistributionProfileRepository users;
    private final PlatformAccountBindingRepository bindings;
    private final PlatformGuildDirectoryRepository guildDirectory;
    private final RelationshipFoundationService relationships;
    private final EffectiveUserQualificationService effectiveUsers;
    private final Clock clock;

    public UserGradeAdminService(JdbcTemplate jdbc, OperationAuditLogRepository audits, UserDistributionProfileRepository users,
                                 PlatformAccountBindingRepository bindings, PlatformGuildDirectoryRepository guildDirectory, Clock clock) {
        this(jdbc, audits, users, bindings, guildDirectory, null, null, clock);
    }
    @Autowired
    public UserGradeAdminService(JdbcTemplate jdbc, OperationAuditLogRepository audits, UserDistributionProfileRepository users,
                                 PlatformAccountBindingRepository bindings, PlatformGuildDirectoryRepository guildDirectory,
                                 RelationshipFoundationService relationships, EffectiveUserQualificationService effectiveUsers, Clock clock) {
        this.jdbc = jdbc; this.audits = audits; this.users = users; this.bindings = bindings; this.guildDirectory = guildDirectory; this.relationships = relationships; this.effectiveUsers = effectiveUsers; this.clock = clock;
    }

    @Transactional(readOnly = true)
    public UserGradeDashboardResponse dashboard() {
        return new UserGradeDashboardResponse(count("select count(*) from user_grade_rule_version where rule_status='ACTIVE'"),
                count("select count(*) from user_grade_evaluation where grade_code='GOLD' and qualification_status='QUALIFIED'"),
                rules(), recentEvaluations());
    }

    @Transactional(readOnly = true)
    public List<UserGradeRuleResponse> rules() {
        return jdbc.query(selectRules() + " order by effective_from desc,id desc", (rs, row) -> mapRule(rs));
    }

    public UserGradeRuleResponse createDraft(UserGradeRuleRequest request, AdminSessionService.AdminPrincipal actor) {
        validate(request);
        LocalDateTime effectiveFrom = request.effectiveFrom() == null ? LocalDateTime.now(clock) : request.effectiveFrom();
        String code = "UG-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase(Locale.ROOT);
        KeyHolder keys = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("insert into user_grade_rule_version(rule_code,rule_version,grade_code,platform_code,country_code,guild_id,required_direct_invite_count,required_direct_income,effective_from,effective_to,rule_status,created_by) values(?,1,?,?,?,?,?,?,?,?,'DRAFT',?)", new String[]{"id"});
            statement.setString(1, code); statement.setString(2, grade(request.gradeCode())); statement.setString(3, platform(request.platformCode()));
            statement.setString(4, upper(request.countryCode())); statement.setString(5, trimToNull(request.guildId()));
            statement.setInt(6, request.requiredDirectInviteCount()); statement.setBigDecimal(7, request.requiredDirectIncome());
            statement.setObject(8, effectiveFrom); statement.setObject(9, request.effectiveTo()); statement.setLong(10, actor.accountId()); return statement;
        }, keys);
        UserGradeRuleResponse created = rule(Objects.requireNonNull(keys.getKey()).longValue());
        audit(actor, created.id(), "CREATE_DRAFT", null, snapshot(created), "建立用户等级规则草稿；只评估直接邀请关系和已定稿 MCN 收入");
        return created;
    }

    public UserGradeRuleResponse activate(long id, String note, AdminSessionService.AdminPrincipal actor) {
        UserGradeRuleResponse current = rule(id);
        if (!"DRAFT".equals(current.status())) throw new IllegalStateException("only draft user grade rule can be activated");
        ensureNoOverlap(current);
        jdbc.update("update user_grade_rule_version set rule_status='ACTIVE',approved_by=?,approved_at=?,approval_note=? where id=?", actor.accountId(), LocalDateTime.now(clock), required(note, "approvalNote"), id);
        UserGradeRuleResponse activated = rule(id);
        audit(actor, id, "ACTIVATE", snapshot(current), snapshot(activated), "审批启用用户等级规则；不会创建奖励或付款");
        return activated;
    }

    public UserGradeRuleResponse retire(long id, AdminSessionService.AdminPrincipal actor) {
        UserGradeRuleResponse current = rule(id);
        if (!"ACTIVE".equals(current.status())) throw new IllegalStateException("only active user grade rule can be retired");
        jdbc.update("update user_grade_rule_version set rule_status='RETIRED',effective_to=coalesce(effective_to,?) where id=?", LocalDateTime.now(clock), id);
        UserGradeRuleResponse retired = rule(id);
        audit(actor, id, "RETIRE", snapshot(current), snapshot(retired), "停止用户等级规则；既有团队负责人资格不会被系统自动撤销");
        return retired;
    }

    /** Evaluates all currently applicable grades for one user/platform. A qualified grade is never automatically downgraded. */
    public List<UserGradeEvaluationResponse> evaluate(long userId, String platformCode) {
        UserDistributionProfile user = users.findById(userId).orElseThrow(() -> new IllegalArgumentException("user not found"));
        String platform = platform(platformCode);
        var binding = bindings.findByUserIdAndPlatformCode(userId, platform)
                .filter(value -> "VERIFIED".equals(value.getBindingStatus().name()) && value.getOfficialGuildId() != null && !value.getOfficialGuildId().isBlank())
                .orElseThrow(() -> new IllegalStateException("user has no verified platform guild binding"));
        String guild = binding.getOfficialGuildId();
        LocalDateTime now = LocalDateTime.now(clock);
        return evaluateRules(user, platform, guild, now);
    }

    private List<UserGradeEvaluationResponse> evaluateRules(UserDistributionProfile user, String platform, String guild, LocalDateTime now) {
        List<UserGradeRuleResponse> all = jdbc.query(selectRules() + " where platform_code=? and country_code=? and rule_status='ACTIVE' and effective_from<=? and (effective_to is null or effective_to>?) and (guild_id is null or guild_id=?) order by grade_code,case when guild_id=? then 0 else 1 end,id desc", (rs, row) -> mapRule(rs), platform, upper(user.getCountryCode()), now, now, guild, guild);
        Map<String, UserGradeRuleResponse> selected = new LinkedHashMap<>();
        all.stream().filter(rule -> baseGrade(rule.gradeCode())).forEach(rule -> selected.putIfAbsent(rule.gradeCode(), rule));
        if (effectiveUsers != null) effectiveUsers.refreshDirectInvitees(user.getUserId(), platform);
        int directCount = effectiveUsers == null ? directEffectiveInviteCount(user.getUserId(), platform, now) : effectiveUsers.qualifiedDirectInviteCount(user.getUserId(), platform, now);
        BigDecimal directIncome = BigDecimal.ZERO;
        List<UserGradeEvaluationResponse> results = selected.values().stream().map(rule -> upsertEvaluation(user, rule, guild, directCount, directIncome, now)).toList();
        if (results.stream().anyMatch(result -> "GOLD".equals(result.gradeCode()) && "QUALIFIED".equals(result.status()))) {
            if (relationships != null) relationships.ensureGoldGradeTeam(user);
        }
        return results;
    }

    /** Scheduled callers use this local-only refresh; it never calls MCN and never generates a payment. */
    public int refreshAllVerifiedUsers() {
        List<Object[]> candidates = jdbc.query("select distinct b.user_id,b.platform_code from platform_account_binding b join invitation_relation_version i on i.inviter_user_id=b.user_id and i.effective_to is null where b.binding_status='VERIFIED'", (rs, row) -> new Object[]{rs.getLong(1), rs.getString(2)});
        int completed = 0;
        for (Object[] candidate : candidates) {
            try { evaluate((Long) candidate[0], (String) candidate[1]); completed++; } catch (RuntimeException ignored) { /* one user must not stop the batch */ }
        }
        return completed;
    }

    private UserGradeEvaluationResponse upsertEvaluation(UserDistributionProfile user, UserGradeRuleResponse rule, String guild, int directCount, BigDecimal directIncome, LocalDateTime now) {
        boolean meets = directCount >= rule.requiredDirectInviteCount() && directIncome.compareTo(rule.requiredDirectIncome()) >= 0;
        String incoming = meets ? "QUALIFIED" : "IN_PROGRESS";
        int changed = jdbc.update("update user_grade_evaluation set qualification_status=case when qualification_status in ('QUALIFIED','REQUIRES_MANUAL_REVIEW') then qualification_status else ? end,rule_id=?,direct_invite_count=?,direct_income=?,qualified_at=case when qualification_status in ('QUALIFIED','REQUIRES_MANUAL_REVIEW') then qualified_at when ?='QUALIFIED' then ? else null end,evaluated_at=? where user_id=? and platform_code=? and guild_id=? and grade_code=?", incoming, rule.id(), directCount, directIncome, incoming, now, now, user.getUserId(), rule.platformCode(), guild, rule.gradeCode());
        if (changed == 0) jdbc.update("insert into user_grade_evaluation(user_id,platform_code,guild_id,grade_code,rule_id,qualification_status,direct_invite_count,direct_income,qualified_at,evaluated_at) values(?,?,?,?,?,?,?,?,?,?)", user.getUserId(), rule.platformCode(), guild, rule.gradeCode(), rule.id(), incoming, directCount, directIncome, meets ? now : null, now);
        UserGradeEvaluationResponse value = evaluation(user.getUserId(), rule.platformCode(), guild, rule.gradeCode());
        return value;
    }

    /** Effective-user eligibility: three distinct income dates in the first seven days after first settled income. */
    private int directEffectiveInviteCount(long userId, String platform, LocalDateTime now) {
        Integer value = jdbc.queryForObject("""
                select count(distinct i.user_id)
                from invitation_relation_version i
                where i.inviter_user_id=? and i.effective_from<=? and (i.effective_to is null or i.effective_to>?)
                  and exists (
                    select 1 from mcn_income_shadow_ledger_projection p
                    join mcn_income_raw_ledger_event r on r.id=p.raw_ledger_event_id
                    where p.resolved_user_id=i.user_id and p.platform_code=? and p.shadow_status='BOUND_FINAL'
                      and r.occurred_at < date_add((select min(r0.occurred_at) from mcn_income_shadow_ledger_projection p0 join mcn_income_raw_ledger_event r0 on r0.id=p0.raw_ledger_event_id where p0.resolved_user_id=i.user_id and p0.platform_code=? and p0.shadow_status='BOUND_FINAL'), interval 7 day)
                    group by p.resolved_user_id
                    having count(distinct date(r.occurred_at)) >= 3
                  )
                """, Integer.class, userId, now, now, platform, platform);
        return value == null ? 0 : value;
    }

    private List<UserGradeEvaluationResponse> recentEvaluations() { return jdbc.query("select user_id,platform_code,guild_id,grade_code,rule_id,qualification_status,direct_invite_count,direct_income,qualified_at,evaluated_at from user_grade_evaluation order by evaluated_at desc,id desc limit 50", (rs, row) -> mapEvaluation(rs)); }
    private UserGradeEvaluationResponse evaluation(long userId, String platform, String guild, String grade) { return jdbc.query("select user_id,platform_code,guild_id,grade_code,rule_id,qualification_status,direct_invite_count,direct_income,qualified_at,evaluated_at from user_grade_evaluation where user_id=? and platform_code=? and guild_id=? and grade_code=?", (rs, row) -> mapEvaluation(rs), userId, platform, guild, grade).getFirst(); }
    private UserGradeRuleResponse rule(long id) { List<UserGradeRuleResponse> values = jdbc.query(selectRules() + " where id=?", (rs, row) -> mapRule(rs), id); if (values.isEmpty()) throw new IllegalArgumentException("user grade rule not found"); return values.getFirst(); }
    private String selectRules() { return "select id,rule_code,rule_version,grade_code,platform_code,country_code,guild_id,required_direct_invite_count,required_direct_income,effective_from,effective_to,rule_status,created_by,approved_by,approved_at,approval_note from user_grade_rule_version"; }
    private UserGradeRuleResponse mapRule(java.sql.ResultSet rs) throws java.sql.SQLException { return new UserGradeRuleResponse(rs.getLong(1), rs.getString(2), rs.getInt(3), rs.getString(4), rs.getString(5), rs.getString(6), rs.getString(7), rs.getInt(8), rs.getBigDecimal(9), rs.getTimestamp(10).toLocalDateTime(), rs.getTimestamp(11) == null ? null : rs.getTimestamp(11).toLocalDateTime(), rs.getString(12), nullableLong(rs, 13), nullableLong(rs, 14), rs.getTimestamp(15) == null ? null : rs.getTimestamp(15).toLocalDateTime(), rs.getString(16)); }
    private UserGradeEvaluationResponse mapEvaluation(java.sql.ResultSet rs) throws java.sql.SQLException { return new UserGradeEvaluationResponse(rs.getLong(1), rs.getString(2), rs.getString(3), rs.getString(4), rs.getLong(5), rs.getString(6), rs.getInt(7), rs.getBigDecimal(8), rs.getTimestamp(9) == null ? null : rs.getTimestamp(9).toLocalDateTime(), rs.getTimestamp(10).toLocalDateTime()); }

    private void validate(UserGradeRuleRequest request) {
        if (request.effectiveTo() != null && request.effectiveFrom() != null && request.effectiveTo().isBefore(request.effectiveFrom())) throw new IllegalArgumentException("effectiveTo must not be before effectiveFrom");
        String platform = platform(request.platformCode()), country = upper(request.countryCode());
        String grade = grade(request.gradeCode());
        if (!baseGrade(grade)) throw new IllegalArgumentException("PLATINUM, DIAMOND and BLACK_GOLD are assessed through training and operating validation records, not direct-invite rules");
        if (request.requiredDirectIncome().compareTo(BigDecimal.ZERO) != 0) throw new IllegalArgumentException("user grade uses direct effective users, not an income threshold");
        Map<String, Integer> fixedDirectCounts = Map.of("NEW_STAR", 3, "SILVER", 10, "GOLD", 30);
        Integer expected = fixedDirectCounts.get(upper(request.gradeCode()));
        if (expected != null && request.requiredDirectInviteCount() != expected) throw new IllegalArgumentException("the configured direct-effective-user threshold does not match the confirmed grade definition");
        if (request.guildId() != null && !request.guildId().isBlank()) {
            List<PlatformGuildDirectory> found = guildDirectory.findByPlatformCodeAndExternalGuildIdIn(platform, List.of(request.guildId().trim()));
            if (found.isEmpty() || !country.equals(countryCode(found.getFirst().getCountry())) || !"NORMAL".equalsIgnoreCase(found.getFirst().getDirectoryStatus())) throw new IllegalArgumentException("user grade rule guild must be an authoritative guild in the selected country");
        }
    }
    private void ensureNoOverlap(UserGradeRuleResponse candidate) { for (UserGradeRuleResponse other : rules()) { if (other.id() == candidate.id() || !"ACTIVE".equals(other.status()) || !other.gradeCode().equals(candidate.gradeCode()) || !other.platformCode().equals(candidate.platformCode()) || !other.countryCode().equals(candidate.countryCode()) || !Objects.equals(other.guildId(), candidate.guildId())) continue; boolean first = other.effectiveTo() == null || !candidate.effectiveFrom().isAfter(other.effectiveTo()); boolean second = candidate.effectiveTo() == null || !other.effectiveFrom().isAfter(candidate.effectiveTo()); if (first && second) throw new IllegalStateException("an active user grade rule already overlaps this grade and scope"); } }
    private long count(String sql) { Long value = jdbc.queryForObject(sql, Long.class); return value == null ? 0 : value; }
    private Long nullableLong(java.sql.ResultSet rs, int index) throws java.sql.SQLException { long value = rs.getLong(index); return rs.wasNull() ? null : value; }
    private void audit(AdminSessionService.AdminPrincipal actor, long id, String action, String before, String after, String remark) { audits.save(OperationAuditLog.create(actor.accountId(), actor.role(), MODULE, "user_grade_rule", id, action, before, after, null, remark, LocalDateTime.now(clock))); }
    private String snapshot(UserGradeRuleResponse rule) { return "code=" + rule.ruleCode() + ";grade=" + rule.gradeCode() + ";scope=" + rule.platformCode() + "/" + rule.countryCode() + "/" + (rule.guildId() == null ? "ALL_GUILDS" : rule.guildId()) + ";directInvite=" + rule.requiredDirectInviteCount() + ";directIncome=" + rule.requiredDirectIncome(); }
    private String grade(String value) { String normalized = upper(value); if (!java.util.Set.of("NEW_STAR", "SILVER", "GOLD", "PLATINUM", "DIAMOND", "BLACK_GOLD").contains(normalized)) throw new IllegalArgumentException("gradeCode must be NEW_STAR, SILVER, GOLD, PLATINUM, DIAMOND or BLACK_GOLD"); return normalized; }
    private boolean baseGrade(String value) { return java.util.Set.of("NEW_STAR", "SILVER", "GOLD").contains(value); }
    private String platform(String value) { String normalized = upper(value); if (!"LINKY".equals(normalized) && !"TIMO".equals(normalized)) throw new IllegalArgumentException("unsupported platform"); return normalized; }
    private String upper(String value) { return required(value, "value").toUpperCase(Locale.ROOT); }
    private String required(String value, String name) { if (value == null || value.isBlank()) throw new IllegalArgumentException(name + " is required"); return value.trim(); }
    private String trimToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private String countryCode(String value) { return switch (upper(value)) { case "BRAZIL" -> "BR"; case "INDONESIA" -> "ID"; case "MEXICO" -> "MX"; default -> upper(value); }; }
}
