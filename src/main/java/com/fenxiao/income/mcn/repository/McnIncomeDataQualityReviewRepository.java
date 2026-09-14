package com.fenxiao.income.mcn.repository;

import com.fenxiao.income.mcn.entity.McnIncomeDataQualityReview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface McnIncomeDataQualityReviewRepository extends JpaRepository<McnIncomeDataQualityReview, Long> {
    Optional<McnIncomeDataQualityReview> findBySourceSystemAndPlatformCodeAndSourceEventIdAndSourceRevision(
            String sourceSystem, String platformCode, String sourceEventId, String sourceRevision);
}
