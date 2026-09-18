package com.fenxiao.relationship.repository;

import com.fenxiao.relationship.entity.OperatingTeamMemberRelation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OperatingTeamMemberRelationRepository extends JpaRepository<OperatingTeamMemberRelation, Long> {
    boolean existsByTeamIdAndUserIdAndEffectiveToIsNull(Long teamId, Long userId);
}
