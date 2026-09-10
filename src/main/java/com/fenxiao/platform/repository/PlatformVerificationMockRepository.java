package com.fenxiao.platform.repository;

import com.fenxiao.platform.entity.PlatformVerificationMock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PlatformVerificationMockRepository extends JpaRepository<PlatformVerificationMock, Long> {
    Optional<PlatformVerificationMock> findByPlatformCodeAndPlatformUserId(String platformCode, String platformUserId);
    List<PlatformVerificationMock> findAllByOrderByPlatformCodeAscPlatformUserIdAsc();
}
