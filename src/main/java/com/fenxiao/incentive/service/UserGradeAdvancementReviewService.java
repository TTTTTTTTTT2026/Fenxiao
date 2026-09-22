package com.fenxiao.incentive.service;

import com.fenxiao.admin.service.AdminSessionService;
import com.fenxiao.audit.entity.OperationAuditLog;
import com.fenxiao.audit.repository.OperationAuditLogRepository;
import com.fenxiao.incentive.dto.UserGradeAdvancementReviewRequest;
import com.fenxiao.incentive.dto.UserGradeAdvancementReviewResponse;
import com.fenxiao.incentive.dto.UserGradePlatinumObservationProgressResponse;
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
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;

/**
 * Platinum is the only active advanced-grade workflow. It has no operating-group
 * entity: the system evaluates directly invited Silver members and their direct
 * invitees from retained, settled income facts.
 */
@Service
@Transactional
public class UserGradeAdvancementReviewService {
    private static final String MODULE = "user_grade_advancement";
    private static final int REQUIRED_SILVER_MEMBERS = 2;
    private final JdbcTemplate jdbc;
    private final OperationAuditLogRepository audits;
    private final UserDistributionProfileRepository users;
    private final Clock clock;

    public UserGradeAdvancementReviewService(JdbcTemplate jdbc, OperationAuditLogRepository audits,
                                              UserDistributionProfileRepository users, Clock clock) {
        this.jdbc = jdbc;
        this.audits = audits;
        this.users = users;
        this.clock = clock;
    }

    public List<UserGradeAdvancementReviewResponse> recent() {
        refreshOpenReviews();
        return jdbc.query(select() + " where target_grade_code='PLATINUM' order by updated_at desc,id desc limit 100", (rs, row) -> map(rs));
    }

    /** Invoked by the scheduler and by the list read so progress never goes stale. */
    public int refreshOpenReviews() {
        List<Long> ids = jdbc.query("select id from user_grade_advancement_review where target_grade_code='PLATINUM' and review_status in ('IN_PROGRESS','EXPIRED')", (rs, row) -> rs.getLong(1));
        ids.forEach(this::refresh);
        return ids.size();
    }

    public UserGradeAdvancementReviewResponse open(UserGradeAdvancementReviewRequest request, AdminSessionService.AdminPrincipal actor) {
        String platform = platform(request.platformCode());
        String guild = required(request.guildId(), "guildId");
        if (!"PLATINUM".equals(grade(request.targetGradeCode()))) throw new IllegalArgumentException("only PLATINUM is currently available for advanced-grade acceptance");
        users.findById(request.userId()).orElseThrow(() -> new IllegalArgumentException("user not found"));
        assertGoldQualified(request.userId(), platform, guild);
        List<UserGradeAdvancementReviewResponse> active = jdbc.query(select() + " where user_id=? and platform_code=? and guild_id=? and target_grade_code='PLATINUM' and review_status in ('IN_PROGRESS','PASSED') order by id desc", (rs, row) -> map(rs), request.userId(), platform, guild);
        if (!active.isEmpty()) return active.getFirst();
        LocalDate start = LocalDate.now(clock);
        LocalDate end = start.plusDays(29);
        KeyHolder keys = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("insert into user_grade_advancement_review(user_id,platform_code,guild_id,target_grade_code,observation_start,observation_end,required_silver_member_count,review_status,created_by) values(?,?,?,?,?,?,?,'IN_PROGRESS',?)", new String[]{"id"});
            statement.setLong(1, request.userId()); statement.setString(2, platform); statement.setString(3, guild); statement.setString(4, "PLATINUM");
            statement.setObject(5, start); statement.setObject(6, end); statement.setInt(7, REQUIRED_SILVER_MEMBERS); statement.setLong(8, actor.accountId());
            return statement;
        }, keys);
        UserGradeAdvancementReviewResponse created = requiredReview(Objects.requireNonNull(keys.getKey()).longValue());
        audit(actor, created, "OPEN_PLATINUM_OBSERVATION", null, snapshot(created), "已开始 30 天铂金观察；系统仅按直邀关系和本地定稿收入计算，不创建经营小组或奖励");
        return created;
    }

    public UserGradeAdvancementReviewResponse confirmCanUpgrade(long id, String note, AdminSessionService.AdminPrincipal actor) {
        UserGradeAdvancementReviewResponse before = refresh(id);
        if (!"PASSED".equals(before.reviewStatus())) throw new IllegalStateException("only a passed Platinum observation can be confirmed for upgrade");
        if (before.promotionConfirmedAt() != null) return before;
        LocalDateTime now = LocalDateTime.now(clock);
        jdbc.update("update user_grade_advancement_review set promotion_confirmed_by=?,promotion_confirmed_at=?,promotion_note=?,updated_at=? where id=? and promotion_confirmed_at is null", actor.accountId(), now, required(note, "note"), now, id);
        UserGradeAdvancementReviewResponse after = requiredReview(id);
        audit(actor, after, "CONFIRM_PLATINUM_UPGRADE", snapshot(before), snapshot(after), "已确认升级为铂金；不会创建额外团队、开启团队经营分成或产生奖励、余额、提现和付款");
        return after;
    }

    public UserGradeAdvancementReviewResponse fail(long id, String note, AdminSessionService.AdminPrincipal actor) {
        UserGradeAdvancementReviewResponse before = refresh(id);
        if ("PASSED".equals(before.reviewStatus()) || before.promotionConfirmedAt() != null) throw new IllegalStateException("a passed or upgraded observation cannot be marked failed");
        if ("FAILED".equals(before.reviewStatus())) return before;
        LocalDateTime now = LocalDateTime.now(clock);
        jdbc.update("update user_grade_advancement_review set review_status='FAILED',failure_note=?,updated_at=? where id=?", required(note, "note"), now, id);
        UserGradeAdvancementReviewResponse after = requiredReview(id);
        audit(actor, after, "MARK_PLATINUM_OBSERVATION_FAILED", snapshot(before), snapshot(after), "运营确认本轮 30 天铂金观察未通过；不影响历史收入事实或已获得的低阶等级");
        return after;
    }

    private UserGradeAdvancementReviewResponse refresh(long id) {
        UserGradeAdvancementReviewResponse before = requiredReview(id);
        if (!"PLATINUM".equals(before.targetGradeCode()) || "FAILED".equals(before.reviewStatus()) || before.promotionConfirmedAt() != null) return before;
        ProgressSummary progress = progress(before);
        String status = LocalDate.now(clock).isAfter(before.observationEnd()) ? (progress.passedSilverMemberCount() >= before.requiredSilverMemberCount() ? "PASSED" : "EXPIRED") : "IN_PROGRESS";
        jdbc.update("update user_grade_advancement_review set eligible_silver_member_count=?,passed_silver_member_count=?,review_status=?,updated_at=? where id=?", progress.eligibleSilverMemberCount(), progress.passedSilverMemberCount(), status, LocalDateTime.now(clock), id);
        return requiredReview(id);
    }

    private ProgressSummary progress(UserGradeAdvancementReviewResponse review) {
        LocalDate completedEnd = LocalDate.now(clock).isAfter(review.observationEnd()) ? review.observationEnd() : LocalDate.now(clock).minusDays(1);
        if (completedEnd.isBefore(review.observationStart())) return new ProgressSummary(0, 0, List.of());
        LocalDate windowStart = completedEnd.minusDays(6).isBefore(review.observationStart()) ? review.observationStart() : completedEnd.minusDays(6);
        List<Long> silverMembers = jdbc.query("""
                select distinct e.user_id from user_grade_evaluation e
                join invitation_relation_version r on r.user_id=e.user_id and r.inviter_user_id=?
                where e.platform_code=? and e.guild_id=? and e.grade_code='SILVER' and e.qualification_status='QUALIFIED'
                  and r.effective_from < ? and (r.effective_to is null or r.effective_to > ?) order by e.user_id
                """, (rs, row) -> rs.getLong(1), review.userId(), review.platformCode(), review.guildId(), review.observationEnd().plusDays(1).atStartOfDay(), review.observationStart().atStartOfDay());
        List<UserGradePlatinumObservationProgressResponse> members = silverMembers.stream().map(memberId -> {
            int effectiveUsers = effectiveDirectInvitees(memberId, review.platformCode(), windowStart, completedEnd);
            return new UserGradePlatinumObservationProgressResponse(memberId, windowStart, completedEnd, effectiveUsers, effectiveUsers >= 5);
        }).toList();
        return new ProgressSummary(members.size(), (int) members.stream().filter(UserGradePlatinumObservationProgressResponse::passed).count(), members);
    }

    /** Every counted user needs three distinct settled-income dates in this Silver member's final-seven-day window. */
    private int effectiveDirectInvitees(long silverUserId, String platform, LocalDate start, LocalDate end) {
        Integer value = jdbc.queryForObject("""
                select count(*) from (select r.user_id from invitation_relation_version r
                    join mcn_income_shadow_ledger_projection p on p.resolved_user_id=r.user_id and p.platform_code=?
                    where r.inviter_user_id=? and cast(r.effective_from as date) <= p.business_date
                      and (r.effective_to is null or cast(r.effective_to as date) > p.business_date)
                      and p.shadow_status='BOUND_FINAL' and p.settlement_status='SETTLED' and p.event_type='INCOME'
                      and p.business_date>=? and p.business_date<=? group by r.user_id having count(distinct p.business_date)>=3
                ) qualified_direct_invitees
                """, Integer.class, platform, silverUserId, start, end);
        return value == null ? 0 : value;
    }

    private void assertGoldQualified(long userId, String platform, String guild) {
        Integer count = jdbc.queryForObject("select count(*) from user_grade_evaluation where user_id=? and platform_code=? and guild_id=? and grade_code='GOLD' and qualification_status='QUALIFIED'", Integer.class, userId, platform, guild);
        if (count == null || count == 0) throw new IllegalStateException("a qualified GOLD grade is required before a Platinum observation can start");
    }
    private UserGradeAdvancementReviewResponse requiredReview(long id) { List<UserGradeAdvancementReviewResponse> values = jdbc.query(select() + " where id=?", (rs, row) -> map(rs), id); if (values.isEmpty()) throw new IllegalArgumentException("grade advancement review not found"); return values.getFirst(); }
    private String select() { return "select id,user_id,platform_code,guild_id,target_grade_code,observation_start,observation_end,eligible_silver_member_count,passed_silver_member_count,required_silver_member_count,review_status,promotion_confirmed_by,promotion_confirmed_at,promotion_note,failure_note,created_by,created_at,updated_at from user_grade_advancement_review"; }
    private UserGradeAdvancementReviewResponse map(java.sql.ResultSet rs) throws java.sql.SQLException {
        long id = rs.getLong(1); LocalDate start = rs.getDate(6).toLocalDate(); LocalDate end = rs.getDate(7).toLocalDate();
        UserGradeAdvancementReviewResponse basic = new UserGradeAdvancementReviewResponse(id, rs.getLong(2), rs.getString(3), rs.getString(4), rs.getString(5), start, end, rs.getInt(8), rs.getInt(9), rs.getInt(10), rs.getString(11), nullableLong(rs, 12), time(rs, 13), rs.getString(14), rs.getString(15), nullableLong(rs, 16), time(rs, 17), time(rs, 18), List.of());
        ProgressSummary progress = progress(basic);
        return new UserGradeAdvancementReviewResponse(basic.id(), basic.userId(), basic.platformCode(), basic.guildId(), basic.targetGradeCode(), basic.observationStart(), basic.observationEnd(), progress.eligibleSilverMemberCount(), progress.passedSilverMemberCount(), basic.requiredSilverMemberCount(), basic.reviewStatus(), basic.promotionConfirmedBy(), basic.promotionConfirmedAt(), basic.promotionNote(), basic.failureNote(), basic.createdBy(), basic.createdAt(), basic.updatedAt(), progress.members());
    }
    private LocalDateTime time(java.sql.ResultSet rs, int index) throws java.sql.SQLException { return rs.getTimestamp(index) == null ? null : rs.getTimestamp(index).toLocalDateTime(); }
    private Long nullableLong(java.sql.ResultSet rs, int index) throws java.sql.SQLException { long value = rs.getLong(index); return rs.wasNull() ? null : value; }
    private String grade(String value) { return required(value, "targetGradeCode").toUpperCase(Locale.ROOT); }
    private String platform(String value) { String platform = required(value, "platformCode").toUpperCase(Locale.ROOT); if (!List.of("TIMO", "LINKY").contains(platform)) throw new IllegalArgumentException("unsupported platform"); return platform; }
    private String required(String value, String field) { if (value == null || value.isBlank()) throw new IllegalArgumentException(field + " is required"); return value.trim(); }
    private void audit(AdminSessionService.AdminPrincipal actor, UserGradeAdvancementReviewResponse review, String action, String before, String after, String remark) { audits.save(OperationAuditLog.create(actor.accountId(), actor.role(), MODULE, "user_grade_advancement_review", review.id(), action, before, after, UUID.randomUUID().toString(), remark, LocalDateTime.now(clock))); }
    private String snapshot(UserGradeAdvancementReviewResponse value) { return "user=" + value.userId() + ";scope=" + value.platformCode() + "/" + value.guildId() + ";grade=" + value.targetGradeCode() + ";window=" + value.observationStart() + "/" + value.observationEnd() + ";passedSilver=" + value.passedSilverMemberCount() + ";status=" + value.reviewStatus(); }
    private record ProgressSummary(int eligibleSilverMemberCount, int passedSilverMemberCount, List<UserGradePlatinumObservationProgressResponse> members) { }
}
