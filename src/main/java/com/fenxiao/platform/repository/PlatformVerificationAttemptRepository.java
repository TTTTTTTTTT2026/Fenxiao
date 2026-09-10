package com.fenxiao.platform.repository;

import com.fenxiao.platform.entity.PlatformVerificationAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PlatformVerificationAttemptRepository extends JpaRepository<PlatformVerificationAttempt, Long> {
    Optional<PlatformVerificationAttempt> findTopByBindingIdOrderByAttemptedAtDesc(Long bindingId);
    long countByBindingIdAndRetryableTrue(Long bindingId);
}
