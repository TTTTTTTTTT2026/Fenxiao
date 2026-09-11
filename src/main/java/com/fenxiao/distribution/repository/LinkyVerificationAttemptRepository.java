package com.fenxiao.distribution.repository;

import com.fenxiao.distribution.entity.LinkyVerificationAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LinkyVerificationAttemptRepository extends JpaRepository<LinkyVerificationAttempt, Long> {
    List<LinkyVerificationAttempt> findTop50ByLinkyAccountOrderByIdDesc(String linkyAccount);
    Optional<LinkyVerificationAttempt> findFirstByLinkyAccountOrderByIdDesc(String linkyAccount);
}
