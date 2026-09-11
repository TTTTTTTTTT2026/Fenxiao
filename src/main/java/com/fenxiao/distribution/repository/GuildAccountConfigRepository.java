package com.fenxiao.distribution.repository;

import com.fenxiao.distribution.entity.GuildAccountConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface GuildAccountConfigRepository extends JpaRepository<GuildAccountConfig, Long> {
    Optional<GuildAccountConfig> findByProductCodeAndInviterUserIdAndEnabledTrue(String productCode, Long inviterUserId);
    List<GuildAccountConfig> findByProductCodeAndInviterUserIdInAndEnabledTrue(String productCode, java.util.Collection<Long> inviterUserIds);
    Optional<GuildAccountConfig> findByProductCodeAndInviterUserIdIsNullAndEnabledTrue(String productCode);
    List<GuildAccountConfig> findByProductCodeOrderByIdDesc(String productCode);
}
