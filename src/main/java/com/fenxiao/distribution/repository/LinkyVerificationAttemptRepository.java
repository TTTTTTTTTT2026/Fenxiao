package com.fenxiao.distribution.repository;

import com.fenxiao.distribution.entity.LinkyVerificationAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LinkyVerificationAttemptRepository extends JpaRepository<LinkyVerificationAttempt, Long> {
    boolean existsByUserId(Long userId);

    @org.springframework.data.jpa.repository.Query(value = """
            SELECT a.* FROM linky_verification_attempt a WHERE a.user_id IN (:userIds)
            AND a.id=(SELECT MAX(b.id) FROM linky_verification_attempt b WHERE b.user_id=a.user_id)
            """, nativeQuery = true)
    List<LinkyVerificationAttempt> findLatestForUsers(java.util.Collection<Long> userIds);

    List<LinkyVerificationAttempt> findTop50ByLinkyAccountOrderByIdDesc(String linkyAccount);
    Optional<LinkyVerificationAttempt> findFirstByLinkyAccountOrderByIdDesc(String linkyAccount);
}
