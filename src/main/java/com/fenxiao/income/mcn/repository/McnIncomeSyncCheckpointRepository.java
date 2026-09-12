package com.fenxiao.income.mcn.repository;

import com.fenxiao.income.mcn.entity.McnIncomeSyncCheckpoint;
import org.springframework.data.jpa.repository.JpaRepository;

public interface McnIncomeSyncCheckpointRepository extends JpaRepository<McnIncomeSyncCheckpoint, String> {
}
