package com.fenxiao.income.mcn.repository;

import com.fenxiao.income.mcn.entity.McnIncomeDeliveryReceipt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface McnIncomeDeliveryReceiptRepository extends JpaRepository<McnIncomeDeliveryReceipt, Long> {
    Optional<McnIncomeDeliveryReceipt> findBySourceSystemAndDeliveryId(String sourceSystem, String deliveryId);
}
