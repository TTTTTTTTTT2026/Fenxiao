package com.fenxiao.platform.service;

import com.fenxiao.platform.domain.PlatformVerificationSource;
import com.fenxiao.platform.entity.PlatformVerificationMock;
import com.fenxiao.platform.repository.PlatformVerificationMockRepository;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
@Profile({"local", "test"})
public class MockPlatformVerificationProvider implements PlatformVerificationProvider {
    private final PlatformVerificationMockRepository mocks;

    public MockPlatformVerificationProvider(PlatformVerificationMockRepository mocks) {
        this.mocks = mocks;
    }

    @Override
    public PlatformVerificationSource source() { return PlatformVerificationSource.MOCK; }

    @Override
    public PlatformVerificationResult verify(String platformCode, String platformUserId) {
        PlatformVerificationMock mock = mocks.findByPlatformCodeAndPlatformUserId(normalizePlatform(platformCode), normalizeId(platformUserId))
                .filter(PlatformVerificationMock::isEnabled)
                .orElseThrow(() -> new IllegalStateException("no enabled local mock verification record exists for this platform account"));
        return new PlatformVerificationResult(mock.isGloballySeenBeforeSubmission(), mock.isJoinedTargetGuild(),
                mock.getOfficialGuildId(), mock.getOfficialJoinedAt(), "LOCAL_MOCK",
                mock.getSourceReference() == null ? "mock:" + mock.getId() : mock.getSourceReference());
    }

    private String normalizePlatform(String value) { return value.trim().toUpperCase(Locale.ROOT); }
    private String normalizeId(String value) { return value.trim(); }
}
