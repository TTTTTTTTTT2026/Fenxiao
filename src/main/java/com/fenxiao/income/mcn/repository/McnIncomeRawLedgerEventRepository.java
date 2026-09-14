package com.fenxiao.income.mcn.repository;

import com.fenxiao.income.mcn.entity.McnIncomeRawLedgerEvent;
import com.fenxiao.income.mcn.domain.McnIncomeEventType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.time.LocalDate;
import java.util.List;

public interface McnIncomeRawLedgerEventRepository extends JpaRepository<McnIncomeRawLedgerEvent, Long> {
    Optional<McnIncomeRawLedgerEvent> findBySourceSystemAndPlatformCodeAndSourceEventIdAndSourceRevision(
            String sourceSystem, String platformCode, String sourceEventId, String sourceRevision);

    List<McnIncomeRawLedgerEvent> findBySourceSystemAndPlatformCodeAndBusinessDateBetween(
            String sourceSystem, String platformCode, LocalDate businessDateFrom, LocalDate businessDateTo);

    /**
     * Latest source truth is selected across all business dates before a date slice is returned.
     * This prevents a cross-day MCN correction from remaining projected on both dates.
     */
    @Query("""
            SELECT event FROM McnIncomeRawLedgerEvent event
            WHERE event.sourceSystem=:sourceSystem AND event.platformCode=:platformCode
              AND event.businessDate BETWEEN :businessDateFrom AND :businessDateTo
              AND NOT EXISTS (
                  SELECT newer FROM McnIncomeRawLedgerEvent newer
                  WHERE newer.sourceSystem=event.sourceSystem AND newer.platformCode=event.platformCode
                    AND newer.sourceEventId=event.sourceEventId
                    AND (newer.sourceUpdatedAt > event.sourceUpdatedAt
                         OR (newer.sourceUpdatedAt=event.sourceUpdatedAt AND newer.sourceRevision > event.sourceRevision))
              )
            """)
    List<McnIncomeRawLedgerEvent> findLatestBySourceSystemAndPlatformCodeAndBusinessDateBetween(
            @Param("sourceSystem") String sourceSystem, @Param("platformCode") String platformCode,
            @Param("businessDateFrom") LocalDate businessDateFrom, @Param("businessDateTo") LocalDate businessDateTo);

    /** Latest reversal facts are read globally because their referenced original can belong to an earlier business date. */
    @Query("""
            SELECT event FROM McnIncomeRawLedgerEvent event
            WHERE event.sourceSystem=:sourceSystem AND event.platformCode=:platformCode AND event.eventType=:eventType
              AND NOT EXISTS (
                  SELECT newer FROM McnIncomeRawLedgerEvent newer
                  WHERE newer.sourceSystem=event.sourceSystem AND newer.platformCode=event.platformCode
                    AND newer.sourceEventId=event.sourceEventId
                    AND (newer.sourceUpdatedAt > event.sourceUpdatedAt
                         OR (newer.sourceUpdatedAt=event.sourceUpdatedAt AND newer.sourceRevision > event.sourceRevision))
              )
            """)
    List<McnIncomeRawLedgerEvent> findLatestBySourceSystemAndPlatformCodeAndEventType(
            @Param("sourceSystem") String sourceSystem, @Param("platformCode") String platformCode,
            @Param("eventType") McnIncomeEventType eventType);
}
