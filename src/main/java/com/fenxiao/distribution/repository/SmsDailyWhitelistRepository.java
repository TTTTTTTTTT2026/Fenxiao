package com.fenxiao.distribution.repository;

import com.fenxiao.distribution.entity.SmsDailyWhitelistEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SmsDailyWhitelistRepository extends JpaRepository<SmsDailyWhitelistEntry, Long> {
    boolean existsByPhoneNumber(String phoneNumber);
    Page<SmsDailyWhitelistEntry> findAllByOrderByIdDesc(Pageable pageable);
}
