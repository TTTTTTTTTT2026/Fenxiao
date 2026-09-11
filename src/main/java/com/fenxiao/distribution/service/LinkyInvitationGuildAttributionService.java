package com.fenxiao.distribution.service;

import com.fenxiao.audit.entity.OperationAuditLog;
import com.fenxiao.audit.repository.OperationAuditLogRepository;
import com.fenxiao.distribution.domain.LinkyInvitationGuildSource;
import com.fenxiao.distribution.entity.DistributionRelation;
import com.fenxiao.distribution.entity.GuildAccountConfig;
import com.fenxiao.distribution.entity.LinkyInvitationGuildAttribution;
import com.fenxiao.distribution.repository.DistributionRelationRepository;
import com.fenxiao.distribution.repository.GuildAccountConfigRepository;
import com.fenxiao.distribution.repository.LinkyInvitationGuildAttributionRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

@Service
@Transactional
public class LinkyInvitationGuildAttributionService {
    private static final String PRODUCT = "LINKY";
    private static final String MODULE = "linky_invitation_guild";
    private final LinkyInvitationGuildAttributionRepository attributions;
    private final DistributionRelationRepository relations;
    private final GuildAccountConfigRepository legacyConfigs;
    private final GuildAccountConfigService guildConfigs;
    private final OperationAuditLogRepository auditLogs;
    private final Clock clock;

    @Autowired
    public LinkyInvitationGuildAttributionService(LinkyInvitationGuildAttributionRepository attributions,
                                                   DistributionRelationRepository relations,
                                                   GuildAccountConfigRepository legacyConfigs,
                                                   GuildAccountConfigService guildConfigs,
                                                   OperationAuditLogRepository auditLogs) {
        this(attributions, relations, legacyConfigs, guildConfigs, auditLogs, Clock.systemUTC());
    }

    LinkyInvitationGuildAttributionService(LinkyInvitationGuildAttributionRepository attributions,
                                            DistributionRelationRepository relations,
                                            GuildAccountConfigRepository legacyConfigs,
                                            GuildAccountConfigService guildConfigs,
                                            OperationAuditLogRepository auditLogs,
                                            Clock clock) {
        this.attributions = attributions;
        this.relations = relations;
        this.legacyConfigs = legacyConfigs;
        this.guildConfigs = guildConfigs;
        this.auditLogs = auditLogs;
        this.clock = clock;
    }

    /** Resolves the guild for a user's own Linky binding. Fallback is recorded but never treated as platform evidence. */
    public ResolvedGuild resolveExpectedGuildForBinding(Long userId) {
        DistributionRelation relation = relations.findByUserId(userId)
                .orElseThrow(() -> new IllegalStateException("distribution relation not found"));
        ResolvedGuild target = relation.getLevel1InviterId() == null
                ? defaultGuild()
                : resolveInviterGuild(relation.getLevel1InviterId(), new HashSet<>());
        LinkyInvitationGuildSource marker = target.source() == LinkyInvitationGuildSource.SYSTEM_DEFAULT
                ? LinkyInvitationGuildSource.SYSTEM_DEFAULT : LinkyInvitationGuildSource.FALLBACK_INHERITED;
        recordFallbackMarker(userId, target, marker);
        return target;
    }

    /** Writes the user's future Linky invitation-route guild after an authoritative Linky binding succeeds. */
    public void recordVerifiedBinding(Long userId, String guildId, String guildName, String guildInviteCode) {
        Optional<LinkyInvitationGuildAttribution> existing = attributions.findById(userId);
        if (existing.isPresent() && existing.get().getAttributionSource() == LinkyInvitationGuildSource.ADMIN_OVERRIDE) {
            return;
        }
        upsert(userId, guildId, guildName, guildInviteCode, LinkyInvitationGuildSource.VERIFIED_BINDING,
                null, null, "authoritative Linky binding verified", null, null);
    }

    public LinkyInvitationGuildAttribution override(Long userId, String guildId, String guildName, String guildInviteCode,
                                                     String reason, Long operatorId, String operatorRole, String requestIp) {
        if (reason == null || reason.isBlank()) throw new IllegalArgumentException("override reason is required");
        relations.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("user distribution relation not found"));
        return upsert(userId, guildId, guildName, guildInviteCode, LinkyInvitationGuildSource.ADMIN_OVERRIDE,
                null, operatorId, reason, operatorRole, requestIp);
    }

    public Optional<LinkyInvitationGuildAttribution> find(Long userId) { return attributions.findById(userId); }

    private ResolvedGuild resolveInviterGuild(Long userId, Set<Long> visited) {
        if (!visited.add(userId)) throw new IllegalStateException("invitation relation cycle prevents Linky guild resolution");
        Optional<LinkyInvitationGuildAttribution> attribution = attributions.findById(userId);
        if (attribution.isPresent()
                && attribution.get().getAttributionSource() == LinkyInvitationGuildSource.ADMIN_OVERRIDE) {
            return ResolvedGuild.from(attribution.get());
        }
        // Keep historical per-inviter settings effective while data is being migrated into the new table.
        Optional<GuildAccountConfig> legacy = legacyConfigs.findByProductCodeAndInviterUserIdAndEnabledTrue(PRODUCT, userId);
        if (legacy.isPresent()) {
            GuildAccountConfig config = legacy.get();
            return new ResolvedGuild(config.getGuildId(), config.getGuildName(), config.getGuildInviteCode(),
                    LinkyInvitationGuildSource.ADMIN_OVERRIDE, userId);
        }
        if (attribution.isPresent() && attribution.get().getAttributionSource() == LinkyInvitationGuildSource.VERIFIED_BINDING) {
            return ResolvedGuild.from(attribution.get());
        }
        DistributionRelation relation = relations.findByUserId(userId).orElse(null);
        return relation == null || relation.getLevel1InviterId() == null
                ? defaultGuild()
                : resolveInviterGuild(relation.getLevel1InviterId(), visited);
    }

    private ResolvedGuild defaultGuild() {
        GuildAccountConfig config = guildConfigs.expectedGuild(PRODUCT, null);
        return new ResolvedGuild(config.getGuildId(), config.getGuildName(), config.getGuildInviteCode(),
                LinkyInvitationGuildSource.SYSTEM_DEFAULT, null);
    }

    private void recordFallbackMarker(Long userId, ResolvedGuild target, LinkyInvitationGuildSource source) {
        Optional<LinkyInvitationGuildAttribution> existing = attributions.findById(userId);
        if (existing.isPresent() && existing.get().getAttributionSource().isEffectiveOverrideOrFact()) return;
        upsert(userId, target.guildId(), target.guildName(), target.guildInviteCode(), source,
                target.ownerUserId(), null, "pending authoritative Linky verification", null, null);
    }

    private LinkyInvitationGuildAttribution upsert(Long userId, String guildId, String guildName, String guildInviteCode,
                                                    LinkyInvitationGuildSource source, Long inheritedFromUserId,
                                                    Long changedBy, String reason, String operatorRole, String requestIp) {
        LocalDateTime now = LocalDateTime.now(clock);
        Optional<LinkyInvitationGuildAttribution> existing = attributions.findById(userId);
        String before = existing.map(this::snapshot).orElse(null);
        LinkyInvitationGuildAttribution value = existing.orElseGet(() -> LinkyInvitationGuildAttribution.create(
                userId, guildId, guildName, guildInviteCode, source, inheritedFromUserId, changedBy, reason, now));
        if (existing.isPresent()) {
            value.replace(guildId, guildName, guildInviteCode, source, inheritedFromUserId, changedBy, reason, now);
        }
        LinkyInvitationGuildAttribution saved = attributions.save(value);
        if (changedBy != null) {
            auditLogs.save(OperationAuditLog.create(changedBy, operatorRole, MODULE, "user_distribution_profile", userId,
                    "INVITATION_GUILD_OVERRIDE", before, snapshot(saved), requestIp, reason, now));
        }
        return saved;
    }

    private String snapshot(LinkyInvitationGuildAttribution value) {
        return "guildId=" + value.getGuildId() + ",source=" + value.getAttributionSource()
                + ",inheritedFromUserId=" + value.getInheritedFromUserId() + ",version=" + value.getVersionNo();
    }

    public record ResolvedGuild(String guildId, String guildName, String guildInviteCode,
                                LinkyInvitationGuildSource source, Long ownerUserId) {
        static ResolvedGuild from(LinkyInvitationGuildAttribution value) {
            return new ResolvedGuild(value.getGuildId(), value.getGuildName(), value.getGuildInviteCode(),
                    value.getAttributionSource(), value.getUserId());
        }
    }
}
