package com.fenxiao.distribution.repository;

import com.fenxiao.distribution.entity.UserEarningsReadAccess;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface UserEarningsReadAccessRepository extends JpaRepository<UserEarningsReadAccess, Long> {
    List<UserEarningsReadAccess> findByUserId(long userId);
}
