package com.fenxiao.platform.service;

import com.fenxiao.admin.service.AdminSessionService;
import com.fenxiao.audit.entity.OperationAuditLog;
import com.fenxiao.audit.repository.OperationAuditLogRepository;
import com.fenxiao.common.api.ForbiddenException;
import com.fenxiao.platform.dto.TimoGuildCountryAccessResponse;
import com.fenxiao.platform.dto.TimoGuildCountryAccessResponse.CountryOption;
import com.fenxiao.platform.dto.UpdateTimoGuildCountriesRequest;
import com.fenxiao.platform.entity.PlatformGuildDirectory;
import com.fenxiao.platform.entity.PlatformTargetGuild;
import com.fenxiao.platform.entity.TimoGuildCountryPolicy;
import com.fenxiao.platform.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class TimoGuildCountryAccessService {
    private static final Set<String> LEGACY_COUNTRIES = Set.of("MX", "ID", "BR");
    private static final List<CountryOption> OPTIONS = List.of(
            new CountryOption("MX", "墨西哥"), new CountryOption("VE", "委内瑞拉"),
            new CountryOption("CO", "哥伦比亚"), new CountryOption("CL", "智利"),
            new CountryOption("PE", "秘鲁"), new CountryOption("ID", "印度尼西亚"), new CountryOption("BR", "巴西"));
    private final TimoGuildCountryPolicyRepository policies;
    private final PlatformTargetGuildRepository targets;
    private final PlatformGuildDirectoryRepository directory;
    private final PlatformIntegrationConfigRepository platforms;
    private final OperationAuditLogRepository audits;
    private final Clock clock;

    public TimoGuildCountryAccessService(TimoGuildCountryPolicyRepository policies, PlatformTargetGuildRepository targets,
                                        PlatformGuildDirectoryRepository directory, PlatformIntegrationConfigRepository platforms,
                                        OperationAuditLogRepository audits, Clock clock) {
        this.policies = policies; this.targets = targets; this.directory = directory;
        this.platforms = platforms; this.audits = audits; this.clock = clock;
    }

    /** No row means inherit the three pre-existing scopes; an explicit empty row means accept nobody. */
    public Summary summary(String guildId) {
        return policies.findById(guildId).map(p -> new Summary(p.getVersion(), true, p.getCountryCodes().stream().sorted().toList()))
                .orElseGet(() -> new Summary(0, false, legacyTargets().stream()
                        .filter(t -> guildId.equals(t.getOfficialGuildId())).map(PlatformTargetGuild::getCountryCode).distinct().sorted().toList()));
    }

    /** One bulk configuration read for the platform page; never scans users or income records. */
    public Map<String, List<String>> acceptedCountriesByGuild() {
        Map<String, Set<String>> values = new HashMap<>();
        legacyTargets().forEach(t -> values.computeIfAbsent(t.getOfficialGuildId(), ignored -> new TreeSet<>()).add(t.getCountryCode()));
        policies.findAll().forEach(p -> values.put(p.getGuildId(), p.getCountryCodes()));
        Map<String, List<String>> result = new HashMap<>();
        values.forEach((guild, countries) -> result.put(guild, countries.stream().sorted().toList()));
        return Map.copyOf(result);
    }

    public TimoGuildCountryAccessResponse get(String platform, String guildId) {
        requireTimo(platform);
        PlatformGuildDirectory guild = requiredGuild(guildId);
        Summary state = summary(guildId);
        return new TimoGuildCountryAccessResponse(guildId, guild.getGuildName(), guild.getCountry(),
                state.version(), state.managed(), state.countryCodes(), OPTIONS);
    }

    @Transactional
    public TimoGuildCountryAccessResponse save(String platform, String guildId, UpdateTimoGuildCountriesRequest request,
                                               AdminSessionService.AdminPrincipal actor, String requestIp) {
        requireTimo(platform);
        if (!"super_admin".equalsIgnoreCase(actor.role())) throw new ForbiddenException("admin permission denied");
        actor.requireScope("TIMO", guildId, null);
        // Very infrequent configuration writes share one stable lock, including first saves and cross-guild transfers.
        platforms.lockForCountryAccess("TIMO").orElseThrow(() -> new IllegalStateException("Timo integration is not configured"));
        PlatformGuildDirectory guild = requiredGuild(guildId);
        requireUsable(guild);
        if (guild.getCountry() == null || guild.getCountry().isBlank()) throw new IllegalArgumentException("MCN公会国家缺失，请先核对MCN目录");
        Summary before = summary(guildId);
        if (request.expectedVersion() == null || before.version() != request.expectedVersion()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "接纳国家配置已变化，请重新打开后再保存");
        }
        if (request.countryCodes() == null) throw new IllegalArgumentException("请选择接纳国家；允许明确清空");
        Set<String> selected = new TreeSet<>();
        for (String value : request.countryCodes()) {
            String code = value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
            if (OPTIONS.stream().noneMatch(c -> c.code().equals(code)) || !selected.add(code)) {
                throw new IllegalArgumentException("接纳国家无效或重复");
            }
        }
        Set<String> affected = new HashSet<>(before.countryCodes()); affected.addAll(selected);
        affected.forEach(code -> actor.requireScope("TIMO", guildId, code));
        for (String code : selected) {
            Optional<BindingTarget> owner = bindingTarget(code);
            if (owner.isPresent() && !guildId.equals(owner.get().guildId())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, code + "已有目标公会 " + owner.get().guildId() + "，请先在原公会移除该国家");
            }
        }
        TimoGuildCountryPolicy policy = policies.findById(guildId).orElseGet(() -> new TimoGuildCountryPolicy(guildId));
        LocalDateTime now = LocalDateTime.now(clock);
        policy.replace(selected, actor.accountId(), now);
        policies.saveAndFlush(policy);
        audits.save(OperationAuditLog.create(actor.accountId(), actor.role(), "TIMO_GUILD_COUNTRY_ACCESS",
                "PLATFORM_GUILD_DIRECTORY", guild.getId(), "SET_ACCEPTED_COUNTRIES",
                "guild=" + guildId + ";version=" + before.version() + ";countries=" + before.countryCodes(),
                "guild=" + guildId + ";version=" + policy.getVersion() + ";countries=" + selected,
                requestIp, "仅调整后续核验范围；不改MCN国家、用户国家、已通过绑定、分佣规则或历史收益", now));
        return get(platform, guildId);
    }

    public Optional<BindingTarget> bindingTarget(String country) {
        Optional<TimoGuildCountryPolicy> explicit = policies.findForCountry(country);
        if (explicit.isPresent()) return Optional.of(new BindingTarget(explicit.get().getGuildId(), null));
        // Only existing MX/ID/BR behavior is inherited. Never infer new scopes from language or MCN country.
        return legacyTargets().stream().filter(t -> country.equals(t.getCountryCode()))
                .filter(t -> !policies.existsById(t.getOfficialGuildId()))
                .map(t -> new BindingTarget(t.getOfficialGuildId(), country)).reduce((a, b) -> {
                    throw new IllegalStateException("multiple enabled Timo targets for " + country);
                });
    }

    private List<PlatformTargetGuild> legacyTargets() {
        return targets.findByPlatformCodeOrderByCountryCodeAscOfficialGuildIdAsc("TIMO").stream()
                .filter(PlatformTargetGuild::isEnabled).filter(t -> LEGACY_COUNTRIES.contains(t.getCountryCode())).toList();
    }
    private PlatformGuildDirectory requiredGuild(String guildId) {
        return directory.findByPlatformCodeAndExternalGuildId("TIMO", guildId)
                .orElseThrow(() -> new IllegalArgumentException("公会不在MCN权威目录中"));
    }
    public static void requireUsable(PlatformGuildDirectory guild) {
        if (!"NORMAL".equalsIgnoreCase(guild.getDirectoryStatus())
                || !("ACTIVE".equalsIgnoreCase(guild.getGuildStatus()) || "ENABLED".equalsIgnoreCase(guild.getGuildStatus()))) {
            throw new IllegalStateException("MCN公会当前未处于正常启用状态，暂不能配置或核验");
        }
    }
    private void requireTimo(String platform) {
        if (!"TIMO".equalsIgnoreCase(platform)) throw new IllegalArgumentException("本期仅支持Timo接纳国家配置");
    }
    public record Summary(int version, boolean managed, List<String> countryCodes) {}
    public record BindingTarget(String guildId, String legacyCountry) {}
}
