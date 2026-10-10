package com.fenxiao.distribution.service;

import com.fenxiao.distribution.domain.BindSource;
import com.fenxiao.distribution.entity.DistributionRelation;
import com.fenxiao.distribution.entity.LinkyAccountBinding;
import com.fenxiao.distribution.repository.DistributionRelationRepository;
import com.fenxiao.distribution.repository.LinkyAccountBindingRepository;
import com.fenxiao.platform.entity.PlatformAccountBinding;
import com.fenxiao.platform.repository.PlatformAccountBindingRepository;
import com.fenxiao.user.entity.UserDistributionProfile;
import com.fenxiao.user.repository.UserDistributionProfileRepository;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class InvitationProgressServiceTest {
    @Test
    void listsOnlyDirectInviteesWithMaskedRegistrationPhonesAndSelectedAppStatus() {
        var relations = mock(DistributionRelationRepository.class);
        var profiles = mock(UserDistributionProfileRepository.class);
        var linky = mock(LinkyAccountBindingRepository.class);
        var timo = mock(PlatformAccountBindingRepository.class);
        var service = new InvitationProgressService(relations, profiles, linky, timo);
        var relation = DistributionRelation.createBound(102L, "ID", BindSource.INVITE_CODE, 101L, null, null, false);
        when(relations.findByLevel1InviterIdAndBindSourceOrderByIdDesc(eq(101L), eq(BindSource.INVITE_CODE), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(relation)));
        var user = UserDistributionProfile.create(102L, "ID", "id", "TEST102");
        user.bindPhoneNumber("+6281359232049");
        when(profiles.findByUserIdIn(List.of(102L))).thenReturn(List.of(user));
        when(timo.findByUserIdInAndPlatformCode(List.of(102L), "TIMO"))
                .thenReturn(List.of(PlatformAccountBinding.submit(102L, "TIMO", "183082848282", LocalDateTime.now())));

        var result = service.get(101L, "TIMO", 0, 20);
        assertEquals(1, result.total());
        assertEquals("SUBMITTED", result.items().getFirst().bindingStatus());
        assertEquals("+628****2049", result.items().getFirst().maskedPhone());
        assertNotNull(result.items().getFirst().registeredAt());
        verifyNoInteractions(linky);
        assertThrows(IllegalArgumentException.class, () -> service.get(101L, "OTHER", 0, 20));
        assertThrows(IllegalArgumentException.class, () -> service.get(101L, "TIMO", 0, 1000));
    }

    @Test
    void avoidsBindingQueriesForAnEmptyPage() {
        var relations = mock(DistributionRelationRepository.class);
        var profiles = mock(UserDistributionProfileRepository.class);
        var linky = mock(LinkyAccountBindingRepository.class);
        var timo = mock(PlatformAccountBindingRepository.class);
        when(relations.findByLevel1InviterIdAndBindSourceOrderByIdDesc(eq(101L), eq(BindSource.INVITE_CODE), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of()));
        var result = new InvitationProgressService(relations, profiles, linky, timo).get(101L, "LINKY", 0, 20);
        assertTrue(result.items().isEmpty());
        verifyNoInteractions(profiles, linky, timo);
    }

    @Test
    void linkyStatusesDoNotTreatRefreshErrorsAsUnboundOrFailedVerification() {
        var binding = LinkyAccountBinding.createUnchecked("LINKY-TEST");
        assertEquals("VERIFYING", InvitationProgressService.linkyStatus(binding));
        binding.markRefreshFailed(null, "temporary failure");
        assertEquals("UNKNOWN", InvitationProgressService.linkyStatus(binding));
        binding.markEligible("guild", "Guild", null, "confirmed");
        assertEquals("VERIFIED", InvitationProgressService.linkyStatus(binding));
        assertNull(InvitationProgressService.maskPhone("12345"));
    }
}
