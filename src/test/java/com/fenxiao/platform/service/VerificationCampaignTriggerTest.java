package com.fenxiao.platform.service;

import com.fenxiao.income.mcn.service.VerificationCampaignService;
import com.fenxiao.platform.domain.PlatformVerificationSource;
import com.fenxiao.platform.entity.PlatformAccountBinding;
import com.fenxiao.platform.repository.PlatformBindingHistoryRepository;
import com.fenxiao.platform.repository.PlatformVerificationAttemptRepository;
import com.fenxiao.user.entity.UserDistributionProfile;
import com.fenxiao.user.repository.UserDistributionProfileRepository;
import org.junit.jupiter.api.Test;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class VerificationCampaignTriggerTest {
    @Test void onlyFirstRealTimoSuccessCapturesAnAward() {
        var lifecycle=mock(PlatformLifecycleService.class);
        var mode=mock(PlatformVerificationModeService.class);
        var provider=mock(PlatformVerificationProvider.class);
        var users=mock(UserDistributionProfileRepository.class);
        var scope=mock(McnTimoGuildScopeResolver.class);
        var attempts=mock(PlatformVerificationAttemptRepository.class);
        var campaigns=mock(VerificationCampaignService.class);
        var histories=mock(PlatformBindingHistoryRepository.class);
        var binding=PlatformAccountBinding.submit(2L,"TIMO","900000000001",LocalDateTime.now());
        when(mode.source()).thenReturn(PlatformVerificationSource.MCN);
        when(provider.source()).thenReturn(PlatformVerificationSource.MCN);
        when(provider.verify(any())).thenReturn(PlatformVerificationResult.found(false,"22000448",LocalDateTime.now(),"MCN_TIMO","test"));
        when(lifecycle.getBinding(2L,"TIMO")).thenReturn(binding);
        when(lifecycle.verify(any())).thenReturn(binding);
        when(users.findById(2L)).thenReturn(Optional.of(UserDistributionProfile.create(2L,"BR","pt","TEST")));
        when(scope.resolve("TIMO","BR")).thenReturn(new McnTimoGuildScopeResolver.ResolvedGuildScope("22000448","BR"));
        var service=new PlatformBindingVerificationService(lifecycle,mode,List.of(provider),users,scope,attempts,Clock.systemUTC(),campaigns,histories);
        service.verifySubmittedBinding(2L,"TIMO");
        verify(campaigns,times(1)).capture(2L,"TIMO");
        when(histories.existsByUserIdAndPlatformCodeAndToStatus(2L,"TIMO","VERIFIED")).thenReturn(true);
        service.verifySubmittedBinding(2L,"TIMO");
        verifyNoMoreInteractions(campaigns);
    }
}
