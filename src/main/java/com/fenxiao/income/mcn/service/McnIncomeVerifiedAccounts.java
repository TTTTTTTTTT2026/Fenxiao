package com.fenxiao.income.mcn.service;

import com.fenxiao.distribution.entity.LinkyAccountBinding;
import com.fenxiao.distribution.repository.LinkyAccountBindingRepository;
import com.fenxiao.platform.domain.PlatformBindingStatus;
import com.fenxiao.platform.entity.PlatformAccountBinding;
import com.fenxiao.platform.repository.PlatformAccountBindingRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

/** The same verified-account rules used by the client workspace and MCN income reads. */
@Component
public class McnIncomeVerifiedAccounts {
    private static final String ELIGIBLE = "ELIGIBLE";
    private static final String MATCHED_OURS = "MATCHED_OURS";
    private final PlatformAccountBindingRepository platformBindings;
    private final LinkyAccountBindingRepository linkyBindings;

    public McnIncomeVerifiedAccounts(PlatformAccountBindingRepository platformBindings,
                                     LinkyAccountBindingRepository linkyBindings) {
        this.platformBindings = platformBindings;
        this.linkyBindings = linkyBindings;
    }

    public List<Account> list(String platform) {
        List<Account> accounts = "LINKY".equals(platform)
                ? linkyBindings.findByUserIdIsNotNullAndRegistrationEligibilityAndGuildCheckStatus(ELIGIBLE, MATCHED_OURS)
                    .stream().map(this::account).toList()
                : platformBindings.findByBindingStatusAndPlatformCode(PlatformBindingStatus.VERIFIED, platform)
                    .stream().map(this::account).toList();
        return accounts.stream().filter(value -> value.platformUserId() != null && !value.platformUserId().isBlank())
                .collect(Collectors.toMap(Account::platformUserId, Function.identity(), (first, ignored) -> first))
                .values().stream().sorted(Comparator.comparing(Account::platformUserId)).toList();
    }

    public Optional<Account> byAccount(String platform, String platformUserId) {
        if ("LINKY".equals(platform)) return linkyBindings.findByLinkyAccount(platformUserId)
                .filter(this::eligible).map(this::account);
        return platformBindings.findByPlatformCodeAndPlatformUserId(platform, platformUserId)
                .filter(value -> value.getBindingStatus() == PlatformBindingStatus.VERIFIED).map(this::account);
    }

    public Optional<Account> byUser(String platform, Long userId) {
        if ("LINKY".equals(platform)) return linkyBindings
                .findFirstByUserIdAndRegistrationEligibilityAndGuildCheckStatusOrderByIdDesc(userId, ELIGIBLE, MATCHED_OURS)
                .filter(this::eligible).map(this::account);
        return platformBindings.findByUserIdAndPlatformCode(userId, platform)
                .filter(value -> value.getBindingStatus() == PlatformBindingStatus.VERIFIED).map(this::account);
    }

    public Map<String, Long> owners(String platform, Collection<String> platformUserIds) {
        if (platformUserIds.isEmpty()) return Map.of();
        if ("LINKY".equals(platform)) return linkyBindings
                .findByLinkyAccountInAndUserIdIsNotNullAndRegistrationEligibilityAndGuildCheckStatus(
                        platformUserIds, ELIGIBLE, MATCHED_OURS).stream()
                .filter(this::eligible).collect(Collectors.toMap(LinkyAccountBinding::getLinkyAccount,
                        LinkyAccountBinding::getUserId, (first, ignored) -> first));
        return platformBindings.findByPlatformCodeAndPlatformUserIdIn(platform, platformUserIds).stream()
                .filter(value -> value.getBindingStatus() == PlatformBindingStatus.VERIFIED)
                .collect(Collectors.toMap(PlatformAccountBinding::getPlatformUserId,
                        PlatformAccountBinding::getUserId, (first, ignored) -> first));
    }

    private boolean eligible(LinkyAccountBinding value) {
        return value.getUserId() != null && ELIGIBLE.equals(value.getRegistrationEligibility())
                && MATCHED_OURS.equals(value.getGuildCheckStatus());
    }

    private Account account(LinkyAccountBinding value) {
        return new Account(value.getUserId(), value.getLinkyAccount(), value.getCheckedAt());
    }

    private Account account(PlatformAccountBinding value) {
        return new Account(value.getUserId(), value.getPlatformUserId(), value.getVerifiedAt());
    }

    public record Account(Long userId, String platformUserId, LocalDateTime verifiedAt) { }
}
