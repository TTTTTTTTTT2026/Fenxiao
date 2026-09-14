package com.fenxiao.rule.repository;

import com.fenxiao.rule.entity.CommissionPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface CommissionPolicyRepository extends JpaRepository<CommissionPolicy, Long> {
    List<CommissionPolicy> findAllByOrderByEffectiveFromDescIdDesc();
    List<CommissionPolicy> findByPlatformCodeAndCountryCodeAndRoleCodeAndStatus(String platformCode, String countryCode, String roleCode, String status);

    @Query("""
            select p from CommissionPolicy p where p.platformCode = :platformCode and p.countryCode = :countryCode
              and p.roleCode = :roleCode and p.commissionType = 'INVITATION' and p.status = 'ACTIVE' and p.effectiveFrom <= :at
              and (p.effectiveTo is null or p.effectiveTo >= :at) order by p.effectiveFrom desc, p.id desc
            """)
    List<CommissionPolicy> findActiveAt(@Param("platformCode") String platformCode, @Param("countryCode") String countryCode,
                                        @Param("roleCode") String roleCode, @Param("at") LocalDateTime at);
}
