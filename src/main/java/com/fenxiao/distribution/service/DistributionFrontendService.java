package com.fenxiao.distribution.service;

import com.fenxiao.distribution.api.dto.DistributionHomeResponse;
import com.fenxiao.distribution.api.dto.TeamListResponse;
import com.fenxiao.distribution.api.dto.TeamMemberItem;
import com.fenxiao.distribution.api.dto.TeamWeeklyIncomeItem;
import com.fenxiao.distribution.api.dto.TeamWeeklyIncomeResponse;
import com.fenxiao.distribution.api.dto.WeeklyIncomeStatsResponse;
import com.fenxiao.distribution.entity.DistributionRelation;
import com.fenxiao.distribution.repository.DistributionRelationRepository;
import com.fenxiao.income.repository.IncomeEventRepository;
import com.fenxiao.reward.api.dto.RewardListItem;
import com.fenxiao.reward.api.dto.RewardListResponse;
import com.fenxiao.reward.api.dto.RewardSummaryResponse;
import com.fenxiao.reward.api.dto.RewardTierSummaryItem;
import com.fenxiao.reward.domain.RewardStatus;
import com.fenxiao.reward.entity.RewardRecord;
import com.fenxiao.reward.repository.RewardRecordRepository;
import com.fenxiao.user.entity.UserDistributionProfile;
import com.fenxiao.user.repository.UserDistributionProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.dao.DataAccessException;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.WeekFields;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.HashSet;
import java.util.Collections;

@Service
@Transactional(readOnly = true)
public class DistributionFrontendService {

    private final UserDistributionProfileRepository userDistributionProfileRepository;
    private final DistributionRelationRepository distributionRelationRepository;
    private final RewardRecordRepository rewardRecordRepository;
    private final IncomeEventRepository incomeEventRepository;
    private final JdbcTemplate jdbc;
    private final Clock clock;

    public DistributionFrontendService(UserDistributionProfileRepository userDistributionProfileRepository,
                                       DistributionRelationRepository distributionRelationRepository,
                                       RewardRecordRepository rewardRecordRepository,
                                       IncomeEventRepository incomeEventRepository,
                                       JdbcTemplate jdbc) {
        this.userDistributionProfileRepository = userDistributionProfileRepository;
        this.distributionRelationRepository = distributionRelationRepository;
        this.rewardRecordRepository = rewardRecordRepository;
        this.incomeEventRepository = incomeEventRepository;
        this.jdbc = jdbc;
        this.clock = Clock.systemUTC();
    }

    public DistributionHomeResponse getHome(Long userId) {
        return getHome(userId, null);
    }

    public DistributionHomeResponse getHome(Long userId, String platformCode) {
        UserDistributionProfile profile = userDistributionProfileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("distribution profile not found"));
        DistributionRelation relation = distributionRelationRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("distribution relation not found"));
        List<DistributionRelation> directRelations = scopedRelations(distributionRelationRepository.findByLevel1InviterIdOrderByIdDesc(userId), platformCode);
        List<DistributionRelation> secondLevelRelations = scopedRelations(distributionRelationRepository.findByLevel2InviterIdOrderByIdDesc(userId), platformCode);
        List<DistributionRelation> thirdLevelRelations = scopedRelations(distributionRelationRepository.findByLevel3InviterIdOrderByIdDesc(userId), platformCode);

        long directEffectiveUsers = platformCode == null ? resolveEffectiveUsers(directRelations) : qualifiedUserIds(directRelations, platformCode).size();
        long secondLevelEffectiveUsers = platformCode == null ? resolveEffectiveUsers(secondLevelRelations) : qualifiedUserIds(secondLevelRelations, platformCode).size();
        long thirdLevelEffectiveUsers = platformCode == null ? resolveEffectiveUsers(thirdLevelRelations) : qualifiedUserIds(thirdLevelRelations, platformCode).size();
        long totalTeamUsers = directRelations.size() + secondLevelRelations.size() + thirdLevelRelations.size();
        long totalEffectiveUsers = directEffectiveUsers + secondLevelEffectiveUsers + thirdLevelEffectiveUsers;
        BigDecimal totalReward = platformCode == null ? rewardRecordRepository.sumRewardAmountByBeneficiaryUserId(userId)
                : scopedLedgerSum(userId, platformCode, "frozen_delta+available_delta");
        BigDecimal frozenReward = platformCode == null ? rewardRecordRepository.sumRewardAmountByBeneficiaryUserIdAndStatus(userId, RewardStatus.FROZEN)
                : scopedLedgerSum(userId, platformCode, "frozen_delta");
        BigDecimal availableReward = platformCode == null ? rewardRecordRepository.sumWithdrawableRewardAmountByBeneficiaryUserId(userId)
                : scopedLedgerSum(userId, platformCode, "available_delta");
        BigDecimal riskHoldReward = platformCode == null ? rewardRecordRepository.sumRewardAmountByBeneficiaryUserIdAndStatus(userId, RewardStatus.RISK_HOLD)
                : BigDecimal.ZERO;

        return new DistributionHomeResponse(
                userId,
                profile.getInviteCode(),
                relation.getLevel1InviterId(),
                directRelations.size(),
                totalEffectiveUsers,
                totalReward,
                frozenReward,
                availableReward,
                riskHoldReward,
                directRelations.size(),
                secondLevelRelations.size(),
                thirdLevelRelations.size(),
                totalTeamUsers,
                directEffectiveUsers,
                secondLevelEffectiveUsers,
                thirdLevelEffectiveUsers,
                totalEffectiveUsers,
                userGradeCode(userId, platformCode)
        );
    }

    private String userGradeCode(Long userId, String platformCode) {
        try {
            String scope = platformCode == null ? "" : " and platform_code=?";
            String query = """
                    select grade_code from user_grade_evaluation
                    where user_id=? and qualification_status='QUALIFIED' %s
                    union all
                    select target_grade_code from user_grade_advancement_review
                    where user_id=? and promotion_confirmed_at is not null %s
                    """.formatted(scope, scope);
            List<String> grades = platformCode == null
                    ? jdbc.query(query, (rs, rowNum) -> rs.getString(1), userId, userId)
                    : jdbc.query(query, (rs, rowNum) -> rs.getString(1), userId, platformCode, userId, platformCode);
            return grades.stream()
                    .max(java.util.Comparator.comparingInt(this::gradeRank))
                    .orElse("NORMAL_MEMBER");
        } catch (DataAccessException ignored) {
            // A grade-schema rollout must never make the customer earnings page unavailable.
            return "NORMAL_MEMBER";
        }
    }

    private int gradeRank(String gradeCode) {
        return switch (gradeCode) {
            case "BLACK_GOLD" -> 6;
            case "DIAMOND" -> 5;
            case "PLATINUM" -> 4;
            case "GOLD" -> 3;
            case "SILVER" -> 2;
            case "NEW_STAR" -> 1;
            default -> 0;
        };
    }

    public TeamListResponse getDirectTeam(Long userId) {
        List<DistributionRelation> directRelations = distributionRelationRepository.findByLevel1InviterIdOrderByIdDesc(userId);
        Map<Long, UserDistributionProfile> profileMap = loadProfileMap(directRelations);
        List<TeamMemberItem> items = new ArrayList<>();
        for (DistributionRelation relation : directRelations) {
            UserDistributionProfile profile = profileMap.get(relation.getUserId());
            if (profile == null) {
                continue;
            }
            items.add(new TeamMemberItem(
                    profile.getUserId(),
                    profile.getInviteCode(),
                    profile.getCountryCode(),
                    profile.isEffectiveUser(),
                    profile.getConfirmedIncomeTotal(),
                    relation.getLockStatus(),
                    relation.getBindTime()
            ));
        }
        return new TeamListResponse(items, items.size());
    }

    public com.fenxiao.distribution.api.dto.EffectiveTeamResponse getEffectiveTeam(Long userId) {
        return getEffectiveTeam(userId, null);
    }

    public com.fenxiao.distribution.api.dto.EffectiveTeamResponse getEffectiveTeam(Long userId, String platformCode) {
        userDistributionProfileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("distribution profile not found"));
        List<DistributionRelation> direct = scopedRelations(distributionRelationRepository.findByLevel1InviterIdOrderByIdDesc(userId), platformCode);
        List<DistributionRelation> second = scopedRelations(distributionRelationRepository.findByLevel2InviterIdOrderByIdDesc(userId), platformCode);
        List<DistributionRelation> third = scopedRelations(distributionRelationRepository.findByLevel3InviterIdOrderByIdDesc(userId), platformCode);
        List<DistributionRelation> all = new ArrayList<>(direct);
        all.addAll(second);
        all.addAll(third);
        Map<Long, UserDistributionProfile> users = loadProfileMap(all);
        Set<Long> qualified = qualifiedUserIds(all, platformCode);
        List<com.fenxiao.distribution.api.dto.EffectiveTeamResponse.Item> items = new ArrayList<>();
        for (int level = 1; level <= 3; level++) {
            List<DistributionRelation> relations = level == 1 ? direct : level == 2 ? second : third;
            for (DistributionRelation relation : relations) {
                UserDistributionProfile member = users.get(relation.getUserId());
                if (member != null && qualified.contains(member.getUserId())) {
                    items.add(new com.fenxiao.distribution.api.dto.EffectiveTeamResponse.Item(
                            member.getUserId(), member.getCountryCode(), level));
                }
            }
        }
        return new com.fenxiao.distribution.api.dto.EffectiveTeamResponse(items, items.size());
    }

    public TeamWeeklyIncomeResponse getTeamWeeklyIncome(Long userId) {
        List<DistributionRelation> directRelations = distributionRelationRepository.findByLevel1InviterIdOrderByIdDesc(userId);
        Map<Long, UserDistributionProfile> profileMap = loadProfileMap(directRelations);
        LocalDate today = LocalDate.now(clock);
        WeekFields weekFields = WeekFields.ISO;
        LocalDate currentStart = today.with(weekFields.dayOfWeek(), 1);
        LocalDate previousStart = currentStart.minusWeeks(1);
        LocalDateTime currentStartAt = currentStart.atStartOfDay();
        LocalDateTime currentEndAt = currentStart.plusWeeks(1).atStartOfDay();
        LocalDateTime previousStartAt = previousStart.atStartOfDay();
        LocalDateTime previousEndAt = currentStart.atStartOfDay();

        List<TeamWeeklyIncomeItem> items = new ArrayList<>();
        BigDecimal currentTotal = BigDecimal.ZERO;
        BigDecimal previousTotal = BigDecimal.ZERO;
        for (DistributionRelation relation : directRelations) {
            UserDistributionProfile profile = profileMap.get(relation.getUserId());
            if (profile == null) {
                continue;
            }
            BigDecimal current = incomeEventRepository.sumIncomeAmountByUserIdAndEventTimeBetween(profile.getUserId(), currentStartAt, currentEndAt);
            BigDecimal previous = incomeEventRepository.sumIncomeAmountByUserIdAndEventTimeBetween(profile.getUserId(), previousStartAt, previousEndAt);
            currentTotal = currentTotal.add(current);
            previousTotal = previousTotal.add(previous);
            items.add(new TeamWeeklyIncomeItem(profile.getUserId(), profile.getInviteCode(), profile.isEffectiveUser(), current, previous));
        }
        return new TeamWeeklyIncomeResponse(userId, weekLabel(currentStart), weekLabel(previousStart), currentTotal, previousTotal, items);
    }

    public RewardListResponse getRewardDetails(Long userId, RewardStatus status) {
        List<RewardRecord> records = status == null
                ? rewardRecordRepository.findByBeneficiaryUserIdOrderByIdDesc(userId)
                : rewardRecordRepository.findByBeneficiaryUserIdAndRewardStatusOrderByIdDesc(userId, status);
        List<RewardListItem> items = new ArrayList<>();
        for (RewardRecord record : records) {
            items.add(new RewardListItem(
                    record.getBeneficiaryUserId(),
                    record.getSourceUserId(),
                    record.getRewardLevel(),
                    record.getRewardAmount(),
                    record.getRewardStatus(),
                    record.getCalculatedAt()
            ));
        }
        return new RewardListResponse(items, items.size(), 0, items.size());
    }

    public RewardSummaryResponse getRewardSummary(Long userId) {
        List<RewardTierSummaryItem> tiers = new ArrayList<>();
        for (int level = 1; level <= 3; level++) {
            tiers.add(new RewardTierSummaryItem(
                    level,
                    switch (level) {
                        case 1 -> "直接邀请奖励";
                        case 2 -> "历史二级佣金（只读）";
                        default -> "历史三级佣金（只读）";
                    },
                    rewardRecordRepository.countByBeneficiaryUserIdAndRewardLevel(userId, level),
                    rewardRecordRepository.sumRewardAmountByBeneficiaryUserIdAndRewardLevel(userId, level)
            ));
        }
        return new RewardSummaryResponse(userId, tiers);
    }

    public WeeklyIncomeStatsResponse getWeeklyStats(Long userId) {
        LocalDate today = LocalDate.now(clock);
        WeekFields weekFields = WeekFields.ISO;
        LocalDate currentStart = today.with(weekFields.dayOfWeek(), 1);
        LocalDate previousStart = currentStart.minusWeeks(1);
        LocalDateTime currentStartAt = currentStart.atStartOfDay();
        LocalDateTime currentEndAt = currentStart.plusWeeks(1).atStartOfDay();
        LocalDateTime previousStartAt = previousStart.atStartOfDay();
        LocalDateTime previousEndAt = currentStart.atStartOfDay();
        return new WeeklyIncomeStatsResponse(
                userId,
                weekLabel(currentStart),
                weekLabel(previousStart),
                incomeEventRepository.sumIncomeAmountByUserIdAndEventTimeBetween(userId, currentStartAt, currentEndAt),
                incomeEventRepository.sumIncomeAmountByUserIdAndEventTimeBetween(userId, previousStartAt, previousEndAt),
                rewardRecordRepository.sumRewardAmountByBeneficiaryUserIdAndCalculatedAtBetween(userId, currentStartAt, currentEndAt),
                rewardRecordRepository.sumRewardAmountByBeneficiaryUserIdAndCalculatedAtBetween(userId, previousStartAt, previousEndAt)
        );
    }

    private String weekLabel(LocalDate date) {
        WeekFields weekFields = WeekFields.ISO;
        return "%d-W%02d".formatted(date.get(weekFields.weekBasedYear()), date.get(weekFields.weekOfWeekBasedYear()));
    }

    private long resolveEffectiveUsers(List<DistributionRelation> directRelations) {
        Map<Long, UserDistributionProfile> profileMap = loadProfileMap(directRelations);
        return directRelations.stream()
                .map(DistributionRelation::getUserId)
                .map(profileMap::get)
                .filter(UserDistributionProfile::isEffectiveUser)
                .count();
    }

    private Set<Long> qualifiedUserIds(List<DistributionRelation> relations, String platformCode) {
        if (relations.isEmpty()) return Set.of();
        List<Long> ids = relations.stream().map(DistributionRelation::getUserId).distinct().toList();
        String placeholders = String.join(",", Collections.nCopies(ids.size(), "?"));
        String query = "select distinct user_id from effective_user_qualification_fact where qualification_status='QUALIFIED' and user_id in (" + placeholders + ")";
        List<Object> args = new ArrayList<>(ids);
        if (platformCode != null) { query += " and platform_code=?"; args.add(platformCode); }
        return new HashSet<>(jdbc.query(query, (rs, row) -> rs.getLong(1), args.toArray()));
    }

    private List<DistributionRelation> scopedRelations(List<DistributionRelation> relations, String platformCode) {
        if (platformCode == null || relations.isEmpty()) return relations;
        List<Long> ids = relations.stream().map(DistributionRelation::getUserId).distinct().toList();
        String placeholders = String.join(",", Collections.nCopies(ids.size(), "?"));
        String query = platformCode.equals("TIMO")
                ? "select user_id from platform_account_binding where platform_code='TIMO' and binding_status='VERIFIED' and user_id in (" + placeholders + ")"
                : "select user_id from linky_account_binding where registration_eligibility='ELIGIBLE' and guild_check_status='MATCHED_OURS' and user_id in (" + placeholders + ")";
        Set<Long> bound = new HashSet<>(jdbc.query(query, (rs, row) -> rs.getLong(1), ids.toArray()));
        return relations.stream().filter(relation -> bound.contains(relation.getUserId())).toList();
    }

    private BigDecimal scopedLedgerSum(Long userId, String platformCode, String expression) {
        BigDecimal sum = jdbc.queryForObject("select coalesce(sum(" + expression + "),0) from invitation_reward_account_ledger where user_id=? and platform_code=?",
                BigDecimal.class, userId, platformCode);
        return sum == null ? BigDecimal.ZERO : sum;
    }

    private Map<Long, UserDistributionProfile> loadProfileMap(List<DistributionRelation> relations) {
        List<Long> userIds = relations.stream().map(DistributionRelation::getUserId).toList();
        Map<Long, UserDistributionProfile> profileMap = new HashMap<>();
        for (UserDistributionProfile profile : userDistributionProfileRepository.findByUserIdIn(userIds)) {
            profileMap.put(profile.getUserId(), profile);
        }
        return profileMap;
    }
}
