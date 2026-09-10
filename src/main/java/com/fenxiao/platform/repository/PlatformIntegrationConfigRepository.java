package com.fenxiao.platform.repository;

import com.fenxiao.platform.entity.PlatformIntegrationConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlatformIntegrationConfigRepository extends JpaRepository<PlatformIntegrationConfig, String> {
    List<PlatformIntegrationConfig> findAllByOrderByPlatformCodeAsc();
}
