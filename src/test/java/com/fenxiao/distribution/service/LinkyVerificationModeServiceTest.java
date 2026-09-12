package com.fenxiao.distribution.service;

import com.fenxiao.distribution.domain.LinkyVerificationSource;
import org.junit.jupiter.api.Test;
import org.springframework.core.env.Environment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class LinkyVerificationModeServiceTest {

    @Test
    void shouldDefaultToMcnWhenNoSourceIsProvided() {
        assertThat(LinkyVerificationSource.parse(null)).isEqualTo(LinkyVerificationSource.MCN);
    }

    @Test
    void shouldRejectLegacyOutsideLocalAndTestProfiles() {
        Environment environment = mock(Environment.class);
        when(environment.matchesProfiles("local | test")).thenReturn(false);
        LinkyVerificationModeService service = new LinkyVerificationModeService("LEGACY", environment);

        assertThatThrownBy(service::validateEnvironment)
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Only MCN Linky verification is allowed outside the local or test profile");
    }
}
