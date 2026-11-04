package com.fenxiao.distribution.repository;

import com.fenxiao.distribution.entity.DistributionRelation;
import com.fenxiao.distribution.domain.BindSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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
    @Query(value="SELECT COUNT(*) FROM distribution_relation r JOIN user_distribution_profile u ON u.user_id=r.user_id WHERE r.level1_inviter_id=:id AND r.bind_source='INVITE_CODE' AND EXISTS (SELECT 1 FROM platform_account_binding b WHERE b.user_id=r.user_id AND b.platform_code='TIMO' AND b.binding_status='VERIFIED')", nativeQuery=true)
    long countVerifiedTimoInvitees(@Param("id") Long inviterId);
    @Query(value="SELECT COUNT(*) FROM distribution_relation r JOIN user_distribution_profile u ON u.user_id=r.user_id WHERE r.level1_inviter_id=:id AND r.bind_source='INVITE_CODE' AND EXISTS (SELECT 1 FROM linky_account_binding b WHERE b.user_id=r.user_id AND b.id=(SELECT MAX(x.id) FROM linky_account_binding x WHERE x.user_id=r.user_id) AND b.registration_eligibility='ELIGIBLE' AND b.guild_check_status='MATCHED_OURS')", nativeQuery=true)
    long countVerifiedLinkyInvitees(@Param("id") Long inviterId);
}
