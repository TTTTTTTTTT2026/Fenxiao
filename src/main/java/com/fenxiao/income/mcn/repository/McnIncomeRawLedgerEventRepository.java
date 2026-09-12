package com.fenxiao.income.mcn.repository;

import com.fenxiao.income.mcn.entity.McnIncomeRawLedgerEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface McnIncomeRawLedgerEventRepository extends JpaRepository<McnIncomeRawLedgerEvent, Long> {
    Optional<McnIncomeRawLedgerEvent> findBySourceSystemAndPlatformCodeAndSourceEventIdAndSourceRevision(
            String sourceSystem, String platformCode, String sourceEventId, String sourceRevision);
}
