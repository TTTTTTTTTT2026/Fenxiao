package com.fenxiao.income.mcn.repository;

import com.fenxiao.income.mcn.entity.McnIncomeRawLedgerEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.time.LocalDate;
import java.util.List;

public interface McnIncomeRawLedgerEventRepository extends JpaRepository<McnIncomeRawLedgerEvent, Long> {
    Optional<McnIncomeRawLedgerEvent> findBySourceSystemAndPlatformCodeAndSourceEventIdAndSourceRevision(
            String sourceSystem, String platformCode, String sourceEventId, String sourceRevision);

    List<McnIncomeRawLedgerEvent> findBySourceSystemAndPlatformCodeAndBusinessDateBetween(
            String sourceSystem, String platformCode, LocalDate businessDateFrom, LocalDate businessDateTo);
}
