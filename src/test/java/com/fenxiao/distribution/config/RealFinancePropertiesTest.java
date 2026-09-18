package com.fenxiao.distribution.config;

import com.fenxiao.common.api.ServiceUnavailableException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RealFinancePropertiesTest {

    @Test
    void defaultsToClosedUntilASeparateLaunchDecision() {
        RealFinanceProperties properties = new RealFinanceProperties();

        assertThatThrownBy(properties::assertWriteEnabled)
                .isInstanceOf(ServiceUnavailableException.class)
                .hasMessageContaining("disabled");
    }

    @Test
    void allowsWritesOnlyAfterAnExplicitEnablement() {
        RealFinanceProperties properties = new RealFinanceProperties();
        properties.setEnabled(true);

        assertThatCode(properties::assertWriteEnabled).doesNotThrowAnyException();
    }
}
