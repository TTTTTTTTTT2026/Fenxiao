package com.fenxiao.income.mcn.repository;

import com.fenxiao.income.mcn.entity.McnIncomeSyncRun;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface McnIncomeSyncRunRepository extends JpaRepository<McnIncomeSyncRun, Long> {
    Optional<McnIncomeSyncRun> findTopByPlatformCodeOrderByCompletedAtDescIdDesc(String platformCode);
}
