package com.fenxiao.income.mcn.repository;

import com.fenxiao.income.mcn.entity.McnIncomeAccountSyncCheckpoint;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface McnIncomeAccountSyncCheckpointRepository extends JpaRepository<McnIncomeAccountSyncCheckpoint, String> {
    List<McnIncomeAccountSyncCheckpoint> findByPlatformCode(String platformCode);
}
