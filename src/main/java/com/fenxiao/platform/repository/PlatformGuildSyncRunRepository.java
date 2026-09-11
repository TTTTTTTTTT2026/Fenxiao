package com.fenxiao.platform.repository;

import com.fenxiao.platform.entity.PlatformGuildSyncRun;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PlatformGuildSyncRunRepository extends JpaRepository<PlatformGuildSyncRun, Long> {
    List<PlatformGuildSyncRun> findTop20ByPlatformCodeOrderByStartedAtDesc(String platformCode);
}
