package com.fenxiao.user.repository;

import com.fenxiao.user.entity.UserDistributionProfile;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UserDistributionProfileRepository extends JpaRepository<UserDistributionProfile, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from UserDistributionProfile u where u.userId = :userId")
    Optional<UserDistributionProfile> findByIdForBinding(Long userId);
    Optional<UserDistributionProfile> findByInviteCode(String inviteCode);
    Optional<UserDistributionProfile> findByPhoneNumber(String phoneNumber);
    boolean existsByInviteCode(String inviteCode);
    long countByEffectiveUserTrue();
    long countByUserIdIn(Collection<Long> userIds);
    long countByUserIdInAndEffectiveUserTrue(Collection<Long> userIds);
    List<UserDistributionProfile> findByUserIdIn(Collection<Long> userIds);
    Page<UserDistributionProfile> findAllByOrderByRegisteredAtDescUserIdDesc(Pageable pageable);
}
