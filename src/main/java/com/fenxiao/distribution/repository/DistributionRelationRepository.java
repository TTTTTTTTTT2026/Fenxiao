package com.fenxiao.distribution.repository;

import com.fenxiao.distribution.entity.DistributionRelation;
import com.fenxiao.distribution.domain.BindSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface DistributionRelationRepository extends JpaRepository<DistributionRelation, Long> {
    Optional<DistributionRelation> findByUserId(Long userId);

    boolean existsByUserId(Long userId);

    List<DistributionRelation> findByLevel1InviterIdOrderByIdDesc(Long level1InviterId);

    Page<DistributionRelation> findByLevel1InviterIdAndBindSourceOrderByIdDesc(Long level1InviterId, BindSource bindSource,
                                                                                Pageable pageable);

    List<DistributionRelation> findByLevel2InviterIdOrderByIdDesc(Long level2InviterId);

    List<DistributionRelation> findByLevel3InviterIdOrderByIdDesc(Long level3InviterId);

    long countByLevel1InviterId(Long level1InviterId);
}
