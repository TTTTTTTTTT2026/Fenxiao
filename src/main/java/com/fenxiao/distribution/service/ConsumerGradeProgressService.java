package com.fenxiao.distribution.service;

import com.fenxiao.distribution.api.dto.ConsumerGradeProgressResponse;
import com.fenxiao.incentive.service.EffectiveUserQualificationService;
import com.fenxiao.incentive.service.UserGradeAdminService;
import com.fenxiao.platform.repository.PlatformAccountBindingRepository;
import com.fenxiao.user.repository.UserDistributionProfileRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Comparator;

/** Reads existing qualification facts. Opening a page never refreshes income, grants a grade or creates a team. */
@Service
public class ConsumerGradeProgressService {
    private final JdbcTemplate jdbc;
    private final UserDistributionProfileRepository users;
    private final PlatformAccountBindingRepository bindings;
    private final EffectiveUserQualificationService qualifications;
    private final UserGradeAdminService grades;
    private final Clock clock;

    public ConsumerGradeProgressService(JdbcTemplate jdbc, UserDistributionProfileRepository users,
                                        PlatformAccountBindingRepository bindings,
                                        EffectiveUserQualificationService qualifications, UserGradeAdminService grades, Clock clock) {
        this.jdbc = jdbc; this.users = users; this.bindings = bindings;
        this.qualifications = qualifications; this.grades = grades; this.clock = clock;
    }

    @Transactional(readOnly = true)
    public ConsumerGradeProgressResponse get(long userId, String platformCode) {
        String platform = ConsumerWorkspaceService.requirePlatform(platformCode);
        var user = users.findById(userId).orElseThrow(() -> new IllegalArgumentException("user not found"));
        var evaluations = jdbc.query("select grade_code,qualification_status,evaluated_at from user_grade_evaluation where user_id=? and platform_code=?",
                (rs, row) -> new Evaluation(rs.getString(1), rs.getString(2), rs.getTimestamp(3).toLocalDateTime()), userId, platform);
        if (evaluations.stream().anyMatch(value -> "REQUIRES_MANUAL_REVIEW".equals(value.state())))
            return result(platform, "REVIEW_REQUIRED", null, null, null, null);
        var confirmed = jdbc.query("select target_grade_code from user_grade_advancement_review where user_id=? and platform_code=? and promotion_confirmed_at is not null",
                (rs, row) -> rs.getString(1), userId, platform);
        evaluations.stream().filter(value -> "QUALIFIED".equals(value.state())).map(Evaluation::grade).forEach(confirmed::add);
        String currentGrade = confirmed.stream().filter(value -> rank(value) > 0).max(Comparator.comparingInt(ConsumerGradeProgressService::rank)).orElse(null);
        if (currentGrade != null) return result(platform, "ACHIEVED", currentGrade, null, null, null);

        var binding = bindings.findByUserIdAndPlatformCode(userId, platform)
                .filter(value -> "VERIFIED".equals(value.getBindingStatus().name()))
                .filter(value -> value.getOfficialGuildId() != null && !value.getOfficialGuildId().isBlank());
        if (binding.isEmpty()) return result(platform, "UNKNOWN", null, null, null, null);
        LocalDateTime now = LocalDateTime.now(clock);
        var rule = grades.applicableBaseRules(platform, user.getCountryCode(), binding.get().getOfficialGuildId(), now)
                .stream().filter(value -> "NEW_STAR".equals(value.gradeCode())).findFirst();
        if (rule.isEmpty() || rule.get().requiredDirectInviteCount() <= 0 || rule.get().requiredDirectIncome().signum() != 0)
            return result(platform, "UNKNOWN", null, null, null, null);
        // Absence of a completed evaluation must not be presented as a confirmed normal-member grade or zero.
        var evaluation = jdbc.query("select evaluated_at from user_grade_evaluation where user_id=? and platform_code=? and guild_id=? and grade_code='NEW_STAR' and qualification_status='IN_PROGRESS' order by evaluated_at desc limit 1",
                (rs, row) -> rs.getTimestamp(1).toLocalDateTime(), userId, platform, binding.get().getOfficialGuildId());
        if (evaluation.isEmpty()) return result(platform, "UNKNOWN", null, null, null, null);
        int count = qualifications.qualifiedDirectInviteCount(userId, platform, now);
        int target = rule.get().requiredDirectInviteCount();
        return result(platform, count >= target ? "AWAITING_REVIEW" : "IN_PROGRESS", "NORMAL_MEMBER", count, target, evaluation.getFirst());
    }

    private ConsumerGradeProgressResponse result(String platform, String state, String grade, Integer count, Integer target, LocalDateTime at) {
        return new ConsumerGradeProgressResponse(platform, state, grade, count, target, at);
    }

    private static int rank(String grade) {
        return switch (grade) { case "NEW_STAR" -> 1; case "SILVER" -> 2; case "GOLD" -> 3;
            case "PLATINUM" -> 4; case "DIAMOND" -> 5; case "BLACK_GOLD" -> 6; default -> 0; };
    }
    private record Evaluation(String grade, String state, LocalDateTime at) { }
}
