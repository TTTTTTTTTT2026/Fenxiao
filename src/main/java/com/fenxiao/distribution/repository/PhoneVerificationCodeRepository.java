package com.fenxiao.distribution.repository;

import com.fenxiao.distribution.entity.PhoneVerificationCode;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.Optional;

public interface PhoneVerificationCodeRepository extends JpaRepository<PhoneVerificationCode, Long> {
    Optional<PhoneVerificationCode> findTopByPhoneNumberAndPurposeAndConsumedFalseOrderByIdDesc(String phoneNumber, String purpose);
    Optional<PhoneVerificationCode> findTopByPhoneNumberAndPurposeAndConsumedFalseAndExpiresAtAfterOrderByIdDesc(String phoneNumber, String purpose, LocalDateTime now);
    Page<PhoneVerificationCode> findAllByOrderByIdDesc(Pageable pageable);
    Page<PhoneVerificationCode> findByPhoneNumberContainingOrderByIdDesc(String phoneNumber, Pageable pageable);
}
