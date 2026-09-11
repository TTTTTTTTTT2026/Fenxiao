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
import com.fenxiao.platform.entity.PlatformAccountBinding;
import com.fenxiao.platform.repository.PlatformAccountBindingRepository;
import com.fenxiao.user.entity.UserDistributionProfile;
import com.fenxiao.user.repository.UserDistributionProfileRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class UserPlatformProfileAdminService {
    private final UserDistributionProfileRepository users;
    private final DistributionRelationRepository relations;
    private final LinkyAccountBindingRepository linkyBindings;
    private final PlatformAccountBindingRepository platformBindings;
    private final LinkyInvitationGuildAttributionRepository invitationGuilds;
    private final GuildAccountConfigRepository legacyGuildConfigs;

    public UserPlatformProfileAdminService(UserDistributionProfileRepository users,
                                           DistributionRelationRepository relations,
                                           LinkyAccountBindingRepository linkyBindings,
                                           PlatformAccountBindingRepository platformBindings,
                                           LinkyInvitationGuildAttributionRepository invitationGuilds,
                                           GuildAccountConfigRepository legacyGuildConfigs) {
        this.users = users;
        this.relations = relations;
        this.linkyBindings = linkyBindings;
        this.platformBindings = platformBindings;
        this.invitationGuilds = invitationGuilds;
        this.legacyGuildConfigs = legacyGuildConfigs;
    }

    public UserPlatformProfileListResponse list(Long userId, int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 100));
        Page<UserDistributionProfile> result = userId == null
                ? users.findAllByOrderByUserIdAsc(PageRequest.of(safePage, safeSize))
                : users.findById(userId).map(value -> new SingleItemPage(value, safePage, safeSize)).orElseGet(() -> new SingleItemPage(safePage, safeSize));
        List<Long> ids = result.getContent().stream().map(UserDistributionProfile::getUserId).toList();
        Map<Long, LinkyAccountBinding> linkyByUser = index(linkyBindings.findByUserIdIn(ids), LinkyAccountBinding::getUserId);
        Map<Long, PlatformAccountBinding> timoByUser = index(platformBindings.findByUserIdInAndPlatformCode(ids, "TIMO"), PlatformAccountBinding::getUserId);
        Map<Long, LinkyInvitationGuildAttribution> guildByUser = index(invitationGuilds.findByUserIdIn(ids), LinkyInvitationGuildAttribution::getUserId);
        Map<Long, GuildAccountConfig> legacyGuildByUser = index(
                legacyGuildConfigs.findByProductCodeAndInviterUserIdInAndEnabledTrue("LINKY", ids), GuildAccountConfig::getInviterUserId);
        List<UserPlatformProfileListResponse.Item> items = result.getContent().stream().map(profile -> {
            var relation = relations.findByUserId(profile.getUserId()).orElse(null);
            return new UserPlatformProfileListResponse.Item(profile.getUserId(), profile.getInviteCode(), profile.getCountryCode(),
                    relation == null ? null : relation.getLevel1InviterId(),
                    linky(linkyByUser.get(profile.getUserId())), timo(timoByUser.get(profile.getUserId())),
                    invitationGuild(guildByUser.get(profile.getUserId()), legacyGuildByUser.get(profile.getUserId())));
        }).toList();
        return new UserPlatformProfileListResponse(items, result.getTotalElements(), safePage, safeSize);
    }

    private UserPlatformProfileListResponse.PlatformBinding linky(LinkyAccountBinding value) {
        if (value == null) return null;
        return new UserPlatformProfileListResponse.PlatformBinding(value.getLinkyAccount(), value.getRegistrationEligibility(),
                value.getGuildId(), value.getGuildName(), value.getCheckedAt() == null ? null : value.getCheckedAt().toString(),
                "LEGACY_PROBE", value.getExpectedGuildSource());
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

    private static final class SingleItemPage extends org.springframework.data.domain.PageImpl<UserDistributionProfile> {
        SingleItemPage(UserDistributionProfile value, int page, int size) { super(List.of(value), PageRequest.of(page, size), 1); }
        SingleItemPage(int page, int size) { super(List.of(), PageRequest.of(page, size), 0); }
    }
}
