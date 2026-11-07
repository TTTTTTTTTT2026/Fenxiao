package com.fenxiao.platform.repository;

import com.fenxiao.platform.entity.PlatformAccountBinding;
import com.fenxiao.platform.domain.PlatformBindingStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface PlatformAccountBindingRepository extends JpaRepository<PlatformAccountBinding, Long> {
    Optional<PlatformAccountBinding> findByUserIdAndPlatformCode(Long userId, String platformCode);
    Optional<PlatformAccountBinding> findByPlatformCodeAndPlatformUserId(String platformCode, String platformUserId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from PlatformAccountBinding b where b.userId=:userId and b.platformCode=:platformCode")
    Optional<PlatformAccountBinding> lockUserBinding(Long userId, String platformCode);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from PlatformAccountBinding b where b.platformCode=:platformCode and b.platformUserId=:platformUserId")
    Optional<PlatformAccountBinding> lockPlatformBinding(String platformCode, String platformUserId);
    @Query(value = "SELECT COUNT(*) FROM platform_binding_reset_archive WHERE platform_code=:platformCode AND platform_user_id=:platformUserId",
            nativeQuery = true)
    long countPriorResets(String platformCode, String platformUserId);
    @Query("""
            select a.platformUserId as platformUserId, max(a.resetAt) as resetAt
            from PlatformBindingResetArchive a
            where a.platformCode=:platformCode and a.platformUserId in :accounts and a.previouslyVerified=true
            group by a.platformUserId
            """)
    List<ResetBoundary> findResetBoundaries(String platformCode, Collection<String> accounts);

    interface ResetBoundary {
        String getPlatformUserId();
        LocalDateTime getResetAt();
    }
    List<PlatformAccountBinding> findByPlatformCodeAndPlatformUserIdIn(String platformCode, Collection<String> platformUserIds);
    List<PlatformAccountBinding> findByUserIdInAndPlatformCode(Collection<Long> userIds, String platformCode);
    List<PlatformAccountBinding> findByBindingStatusAndPlatformCode(PlatformBindingStatus bindingStatus, String platformCode);
}
