package com.fenxiao.platform.repository;

import com.fenxiao.platform.entity.PlatformIntegrationConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlatformIntegrationConfigRepository extends JpaRepository<PlatformIntegrationConfig, String> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select p from PlatformIntegrationConfig p where p.platformCode = :platform")
    java.util.Optional<PlatformIntegrationConfig> lockForCountryAccess(@org.springframework.data.repository.query.Param("platform") String platform);
    List<PlatformIntegrationConfig> findAllByOrderByPlatformCodeAsc();

    default void saveIfAbsent(PlatformIntegrationConfig config) {
        if (!existsById(config.getPlatformCode())) save(config);
    }
}
