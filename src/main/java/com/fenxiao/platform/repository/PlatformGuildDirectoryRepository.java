package com.fenxiao.platform.repository;

import com.fenxiao.platform.entity.PlatformGuildDirectory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PlatformGuildDirectoryRepository extends JpaRepository<PlatformGuildDirectory, Long> {
    Optional<PlatformGuildDirectory> findByPlatformCodeAndExternalGuildId(String platformCode, String externalGuildId);
    List<PlatformGuildDirectory> findByPlatformCodeOrderByExternalGuildIdAsc(String platformCode);
    List<PlatformGuildDirectory> findByPlatformCodeAndLastSyncRunIdNot(String platformCode, String lastSyncRunId);
}
