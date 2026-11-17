package com.fenxiao.distribution.repository;

import com.fenxiao.distribution.entity.SubordinatePreRegistration;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.domain.*;
import jakarta.persistence.LockModeType;
import java.time.LocalDateTime;
import java.util.*;

public interface SubordinatePreRegistrationRepository extends JpaRepository<SubordinatePreRegistration, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from SubordinatePreRegistration a where a.id=:id")
    Optional<SubordinatePreRegistration> lockById(Long id);
    Page<SubordinatePreRegistration> findByInviterIdOrderByIdDesc(Long inviterId, Pageable page);
    @Query("select a.id from SubordinatePreRegistration a where a.status='PENDING' and (a.nextCheckAt<=:now or a.expiresAt<=:now) order by case when a.expiresAt<=:now then 0 else 1 end, a.nextCheckAt, a.id")
    List<Long> findDue(LocalDateTime now, Pageable page);
}
