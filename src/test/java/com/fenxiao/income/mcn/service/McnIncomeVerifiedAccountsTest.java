package com.fenxiao.income.mcn.service;

import com.fenxiao.distribution.entity.LinkyAccountBinding;
import com.fenxiao.distribution.repository.LinkyAccountBindingRepository;
import com.fenxiao.platform.domain.PlatformBindingStatus;
import com.fenxiao.platform.entity.PlatformAccountBinding;
import com.fenxiao.platform.repository.PlatformAccountBindingRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class McnIncomeVerifiedAccountsTest {
    @Test
    void linkyUsesTheVerifiedClientBindingAndPreservesLeadingZeros() {
        PlatformAccountBindingRepository generic = mock(PlatformAccountBindingRepository.class);
        LinkyAccountBindingRepository linky = mock(LinkyAccountBindingRepository.class);
        LinkyAccountBinding valid = binding(7L, "00123456", "ELIGIBLE", "MATCHED_OURS");
        LinkyAccountBinding pending = binding(8L, "12345678", "INELIGIBLE", "PENDING");
        when(linky.findByUserIdIsNotNullAndRegistrationEligibilityAndGuildCheckStatus("ELIGIBLE", "MATCHED_OURS"))
                .thenReturn(List.of(valid));
        when(linky.findByLinkyAccount("00123456")).thenReturn(Optional.of(valid));
        when(linky.findByLinkyAccount("12345678")).thenReturn(Optional.of(pending));
        when(linky.findByLinkyAccountInAndUserIdIsNotNullAndRegistrationEligibilityAndGuildCheckStatus(
                List.of("00123456", "12345678"), "ELIGIBLE", "MATCHED_OURS")).thenReturn(List.of(valid));
        McnIncomeVerifiedAccounts accounts = new McnIncomeVerifiedAccounts(generic, linky);

        assertThat(accounts.list("LINKY")).extracting(McnIncomeVerifiedAccounts.Account::platformUserId)
                .containsExactly("00123456");
        assertThat(accounts.byAccount("LINKY", "00123456")).map(McnIncomeVerifiedAccounts.Account::userId)
                .contains(7L);
        assertThat(accounts.byAccount("LINKY", "12345678")).isEmpty();
        assertThat(accounts.owners("LINKY", List.of("00123456", "12345678")))
                .containsOnlyKeys("00123456").containsEntry("00123456", 7L);
    }

    @Test
    void timoStillUsesItsExistingVerifiedBinding() {
        PlatformAccountBindingRepository generic = mock(PlatformAccountBindingRepository.class);
        PlatformAccountBinding verified = PlatformAccountBinding.submit(9L, "TIMO", "123456789012", LocalDateTime.now());
        verified.verify("guild", LocalDateTime.now(), "MCN", "ref", LocalDateTime.now());
        when(generic.findByBindingStatusAndPlatformCode(PlatformBindingStatus.VERIFIED, "TIMO"))
                .thenReturn(List.of(verified));
        when(generic.findByPlatformCodeAndPlatformUserId("TIMO", "123456789012"))
                .thenReturn(Optional.of(verified));
        McnIncomeVerifiedAccounts accounts = new McnIncomeVerifiedAccounts(generic, mock(LinkyAccountBindingRepository.class));

        assertThat(accounts.list("TIMO")).extracting(McnIncomeVerifiedAccounts.Account::platformUserId)
                .containsExactly("123456789012");
        assertThat(accounts.byAccount("TIMO", "123456789012")).map(McnIncomeVerifiedAccounts.Account::userId)
                .contains(9L);
    }

    private static LinkyAccountBinding binding(Long userId, String id, String eligibility, String status) {
        LinkyAccountBinding binding = mock(LinkyAccountBinding.class);
        when(binding.getUserId()).thenReturn(userId);
        when(binding.getLinkyAccount()).thenReturn(id);
        when(binding.getRegistrationEligibility()).thenReturn(eligibility);
        when(binding.getGuildCheckStatus()).thenReturn(status);
        return binding;
    }
}
