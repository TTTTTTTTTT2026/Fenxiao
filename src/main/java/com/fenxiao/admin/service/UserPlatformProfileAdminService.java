package com.fenxiao.admin.service;

import com.fenxiao.admin.api.dto.UserPlatformProfileListResponse;
import com.fenxiao.distribution.entity.LinkyAccountBinding;
import com.fenxiao.distribution.entity.LinkyInvitationGuildAttribution;
import com.fenxiao.distribution.entity.GuildAccountConfig;
import com.fenxiao.distribution.domain.LinkyInvitationGuildSource;
import com.fenxiao.distribution.repository.DistributionRelationRepository;
import com.fenxiao.distribution.repository.GuildAccountConfigRepository;
import com.fenxiao.distribution.repository.LinkyAccountBindingRepository;
import com.fenxiao.distribution.repository.LinkyInvitationGuildAttributionRepository;
import com.fenxiao.distribution.repository.LinkyVerificationAttemptRepository;
import com.fenxiao.platform.entity.PlatformAccountBinding;
import com.fenxiao.platform.repository.PlatformAccountBindingRepository;
import com.fenxiao.identity.entity.UserPasswordCredential;
import com.fenxiao.identity.repository.UserPasswordCredentialRepository;
import com.fenxiao.user.entity.UserDistributionProfile;
import com.fenxiao.user.repository.UserDistributionProfileRepository;
import com.fenxiao.user.repository.UserPublicProfileRepository;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class UserPlatformProfileAdminService {
    private final UserDistributionProfileRepository users;
    private final UserPublicProfileRepository publicProfiles;
    private final UserPasswordCredentialRepository passwordCredentials;
    private final DistributionRelationRepository relations;
    private final LinkyAccountBindingRepository linkyBindings;
    private final PlatformAccountBindingRepository platformBindings;
    private final LinkyInvitationGuildAttributionRepository invitationGuilds;
    private final GuildAccountConfigRepository legacyGuildConfigs;
    private final LinkyVerificationAttemptRepository linkyVerificationAttempts;
    private final JdbcTemplate jdbc;

    public UserPlatformProfileAdminService(UserDistributionProfileRepository users,
                                           UserPublicProfileRepository publicProfiles,
                                           UserPasswordCredentialRepository passwordCredentials,
                                           DistributionRelationRepository relations,
                                           LinkyAccountBindingRepository linkyBindings,
                                           PlatformAccountBindingRepository platformBindings,
                                           LinkyInvitationGuildAttributionRepository invitationGuilds,
                                           GuildAccountConfigRepository legacyGuildConfigs,
                                           LinkyVerificationAttemptRepository linkyVerificationAttempts,
                                           JdbcTemplate jdbc) {
        this.users = users;
        this.publicProfiles = publicProfiles;
        this.passwordCredentials = passwordCredentials;
        this.relations = relations;
        this.linkyBindings = linkyBindings;
        this.platformBindings = platformBindings;
        this.invitationGuilds = invitationGuilds;
        this.legacyGuildConfigs = legacyGuildConfigs;
        this.linkyVerificationAttempts = linkyVerificationAttempts;
        this.jdbc = jdbc;
    }

    public UserPlatformProfileListResponse list(Long userId, int page, int size) {
        return list(new Filters(userId, null, false, null, null, null, null, null), page, size);
    }

    public UserPlatformProfileListResponse list(Filters filters, int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 100));
        SearchPage searchPage = search(filters, safePage, safeSize);
        List<Long> ids = searchPage.userIds();
        Map<Long, UserDistributionProfile> usersById = index(users.findByUserIdIn(ids), UserDistributionProfile::getUserId);
        List<UserDistributionProfile> profiles = ids.stream().map(usersById::get).filter(Objects::nonNull).toList();
        Map<Long, LinkyAccountBinding> linkyByUser = linkyBindings.findByUserIdIn(ids).stream()
                .collect(Collectors.toMap(LinkyAccountBinding::getUserId, Function.identity(),
                        (left, right) -> left.getId() >= right.getId() ? left : right, HashMap::new));
        Map<Long, PlatformAccountBinding> timoByUser = index(platformBindings.findByUserIdInAndPlatformCode(ids, "TIMO"), PlatformAccountBinding::getUserId);
        Map<Long, LinkyInvitationGuildAttribution> guildByUser = index(invitationGuilds.findByUserIdIn(ids), LinkyInvitationGuildAttribution::getUserId);
        Map<Long, GuildAccountConfig> legacyGuildByUser = index(
                legacyGuildConfigs.findByProductCodeAndInviterUserIdInAndEnabledTrue("LINKY", ids), GuildAccountConfig::getInviterUserId);
        Map<Long, String> gradesByUser = gradesByUser(ids);
        Map<Long, UserPasswordCredential> passwordsByUser = index(passwordCredentials.findByUserIdIn(ids), UserPasswordCredential::getUserId);
        Map<Long, UserOperationsAdminService.Current> operationsByUser = new HashMap<>();
        if (!ids.isEmpty()) {
            String placeholders = ids.stream().map(value -> "?").collect(Collectors.joining(","));
            jdbc.query("""
                    select p.user_id, p.operator_admin_id, p.value_code, a.display_name
                    from user_operations_profile p left join admin_account a on a.id = p.operator_admin_id
                    where p.user_id in (%s)
                    """.formatted(placeholders), rs -> {
                Number operator = (Number) rs.getObject("operator_admin_id");
                operationsByUser.put(rs.getLong("user_id"), new UserOperationsAdminService.Current(
                        operator == null ? null : operator.longValue(), rs.getString("display_name"), rs.getString("value_code")));
            }, ids.toArray());
        }
        Map<Long, Long> inviterByUser = new HashMap<>();
        for (Long id : ids) {
            relations.findByUserId(id).ifPresent(relation -> inviterByUser.put(id, relation.getLevel1InviterId()));
        }
        Set<Long> nicknameIds = new HashSet<>(ids);
        inviterByUser.values().stream().filter(Objects::nonNull).forEach(nicknameIds::add);
        Map<Long, String> nicknamesByUser = new HashMap<>();
        if (!nicknameIds.isEmpty()) {
            publicProfiles.findNicknamesByUserIds(nicknameIds)
                    .forEach(row -> nicknamesByUser.put((Long) row[0], (String) row[1]));
        }
        List<UserPlatformProfileListResponse.Item> items = profiles.stream().map(profile -> {
            Long inviterId = inviterByUser.get(profile.getUserId());
            var operations = operationsByUser.getOrDefault(profile.getUserId(),
                    new UserOperationsAdminService.Current(null, null, UserOperationsAdminService.GENERAL));
            return new UserPlatformProfileListResponse.Item(profile.getUserId(), nicknamesByUser.get(profile.getUserId()),
                    profile.getInviteCode(), profile.getCountryCode(), profile.getPhoneNumber(), profile.getRegisteredAt(),
                    inviterId, inviterId == null ? null : nicknamesByUser.get(inviterId),
                    gradesByUser.getOrDefault(profile.getUserId(), "NORMAL_MEMBER"),
                    passwordsByUser.containsKey(profile.getUserId()) && passwordsByUser.get(profile.getUserId()).isEnabled(),
                    linky(linkyByUser.get(profile.getUserId())), timo(timoByUser.get(profile.getUserId())),
                    invitationGuild(guildByUser.get(profile.getUserId()), legacyGuildByUser.get(profile.getUserId())),
                    operations.operatorAdminId(), operations.operatorName(), operations.valueCode());
        }).toList();
        return new UserPlatformProfileListResponse(items, searchPage.total(), safePage, safeSize);
    }

    private SearchPage search(Filters filters, int page, int size) {
        if (filters.operatorAdminId() != null && filters.unassigned())
            throw new IllegalArgumentException("conflicting operator filters");
        if (filters.valueCode() != null && !Set.of("GENERAL", "HIGH_VALUE").contains(filters.valueCode()))
            throw new IllegalArgumentException("invalid user value filter");
        StringBuilder where = new StringBuilder(" from user_distribution_profile u left join user_operations_profile op on op.user_id = u.user_id where 1=1");
        List<Object> parameters = new ArrayList<>();
        if (filters.userId() != null) { where.append(" and u.user_id = ?"); parameters.add(filters.userId()); }
        if (filters.operatorAdminId() != null) { where.append(" and op.operator_admin_id = ?"); parameters.add(filters.operatorAdminId()); }
        if (filters.unassigned()) where.append(" and op.operator_admin_id is null");
        if (filters.valueCode() != null) {
            where.append(" and coalesce(op.value_code, 'GENERAL') = ?"); parameters.add(filters.valueCode());
        }
        if (filters.countryCode() != null && !filters.countryCode().isBlank()) {
            where.append(" and u.country_code = ?"); parameters.add(filters.countryCode().trim().toUpperCase());
        }
        if (filters.localPhone() != null && !filters.localPhone().isBlank()) {
            String phone = filters.localPhone().trim();
            if (!phone.matches("[0-9]{7,15}")) throw new IllegalArgumentException("local phone must contain 7-15 digits");
            where.append(" and u.phone_number like ?"); parameters.add("%" + phone);
        }
        if (filters.linkyGuildId() != null && !filters.linkyGuildId().isBlank()) {
            where.append(" and exists (select 1 from linky_account_binding l where l.user_id = u.user_id"
                    + " and l.id = (select max(latest.id) from linky_account_binding latest where latest.user_id = u.user_id)"
                    + " and l.guild_id = ?)");
            parameters.add(filters.linkyGuildId().trim());
        }
        if (filters.timoGuildId() != null && !filters.timoGuildId().isBlank()) {
            where.append(" and exists (select 1 from platform_account_binding t where t.user_id = u.user_id and t.platform_code = 'TIMO' and t.official_guild_id = ?)");
            parameters.add(filters.timoGuildId().trim());
        }
        Long total = jdbc.queryForObject("select count(*)" + where, Long.class, parameters.toArray());
        List<Object> pageParameters = new ArrayList<>(parameters);
        pageParameters.add(size);
        pageParameters.add((long) page * size);
        List<Long> userIds = jdbc.queryForList("select u.user_id" + where + " order by u.registered_at desc, u.user_id desc limit ? offset ?",
                Long.class, pageParameters.toArray());
        return new SearchPage(userIds, total == null ? 0 : total);
    }

    public record Filters(Long userId, Long operatorAdminId, boolean unassigned, String valueCode,
                          String countryCode, String localPhone, String linkyGuildId, String timoGuildId) {}
    private record SearchPage(List<Long> userIds, long total) {}

    private Map<Long, String> gradesByUser(List<Long> userIds) {
        if (userIds.isEmpty()) return Map.of();
        String placeholders = userIds.stream().map(value -> "?").collect(Collectors.joining(","));
        List<Object> parameters = new java.util.ArrayList<>(userIds.size() * 2);
        parameters.addAll(userIds);
        parameters.addAll(userIds);
        try {
            Map<Long, String> result = new HashMap<>();
            jdbc.query("""
                    select user_id,grade_code from user_grade_evaluation
                    where qualification_status='QUALIFIED' and user_id in (%s)
                    union all
                    select user_id,target_grade_code from user_grade_advancement_review
                    where review_status='LEADER_CONFIRMED' and user_id in (%s)
                    """.formatted(placeholders, placeholders), (rs, row) -> new Object[]{rs.getLong(1), rs.getString(2)}, parameters.toArray())
                    .forEach(row -> result.merge((Long) row[0], (String) row[1],
                            (left, right) -> gradeRank(left) >= gradeRank(right) ? left : right));
            return result;
        } catch (DataAccessException ignored) {
            // A partially rolled-out grade schema must not make the user directory unavailable.
            return Map.of();
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

    private UserPlatformProfileListResponse.PlatformBinding linky(LinkyAccountBinding value) {
        if (value == null) return null;
        return new UserPlatformProfileListResponse.PlatformBinding(value.getLinkyAccount(), value.getRegistrationEligibility(),
                value.getGuildId(), value.getGuildName(), value.getCheckedAt() == null ? null : value.getCheckedAt().toString(),
                linkyVerificationAttempts.findFirstByLinkyAccountOrderByIdDesc(value.getLinkyAccount())
                        .map(attempt -> switch (attempt.getVerificationSource()) {
                            case "MCN" -> "MCN_LINKY";
                            case "MOCK" -> "LOCAL_MOCK";
                            default -> "LEGACY_PROBE";
                        }).orElse("LEGACY_PROBE"), value.getExpectedGuildSource());
    }
    private UserPlatformProfileListResponse.PlatformBinding timo(PlatformAccountBinding value) {
        if (value == null) return null;
        return new UserPlatformProfileListResponse.PlatformBinding(value.getPlatformUserId(), value.getBindingStatus().name(),
                value.getOfficialGuildId(), null, value.getVerifiedAt() == null ? null : value.getVerifiedAt().toString(), "MCN_TIMO", null);
    }
    private UserPlatformProfileListResponse.InvitationGuild invitationGuild(LinkyInvitationGuildAttribution value, GuildAccountConfig legacy) {
        if (value != null && value.getAttributionSource() == LinkyInvitationGuildSource.ADMIN_OVERRIDE) {
            return mapped(value);
        }
        if (legacy != null) {
            return new UserPlatformProfileListResponse.InvitationGuild(legacy.getGuildId(), legacy.getGuildName(), legacy.getGuildInviteCode(),
                    "LEGACY_ADMIN_CONFIG", null, null, "历史按邀请人维护的公会配置");
        }
        return value == null ? null : mapped(value);
    }
    private UserPlatformProfileListResponse.InvitationGuild mapped(LinkyInvitationGuildAttribution value) {
        return new UserPlatformProfileListResponse.InvitationGuild(value.getGuildId(), value.getGuildName(), value.getGuildInviteCode(),
                value.getAttributionSource().name(), value.getInheritedFromUserId(), value.getEffectiveAt().toString(), value.getChangeReason());
    }
    private static <T> Map<Long, T> index(Collection<T> values, Function<T, Long> id) {
        return values.stream().collect(Collectors.toMap(id, Function.identity(), (left, right) -> left, HashMap::new));
    }

}
