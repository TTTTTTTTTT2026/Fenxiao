package com.fenxiao.relationship.repository;

import com.fenxiao.relationship.entity.InvitationRelationVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;
import java.time.LocalDateTime;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InvitationRelationVersionRepository extends JpaRepository<InvitationRelationVersion,Long> {
    Optional<InvitationRelationVersion> findTopByUserIdOrderByVersionNoDesc(Long userId);
    List<InvitationRelationVersion> findByInviterUserIdAndEffectiveToIsNull(Long inviterUserId);

    @Query("""
            select v from InvitationRelationVersion v
            where v.userId = :userId and v.effectiveFrom <= :at
              and (v.effectiveTo is null or v.effectiveTo > :at)
            order by v.versionNo desc
            """)
    Optional<InvitationRelationVersion> findEffectiveAt(@Param("userId") Long userId, @Param("at") LocalDateTime at);
}
