package com.fenxiao.distribution.service;

import com.fenxiao.distribution.entity.LinkyVerificationAttempt;
import com.fenxiao.distribution.repository.LinkyVerificationAttemptRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LinkyVerificationAttemptService {
    private final LinkyVerificationAttemptRepository repository;

    public LinkyVerificationAttemptService(LinkyVerificationAttemptRepository repository) {
        this.repository = repository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(Long userId, String linkyAccount, String expectedGuildId, String source, String resultStatus,
                       String membershipStatus, String observedGuildId, String requestId, String snapshotAt,
                       String sourceGeneration, String checksum, String errorCode, boolean retryable) {
        repository.save(LinkyVerificationAttempt.create(userId, linkyAccount, expectedGuildId, source, resultStatus,
                membershipStatus, observedGuildId, requestId, snapshotAt, sourceGeneration, checksum, errorCode, retryable));
    }
}
