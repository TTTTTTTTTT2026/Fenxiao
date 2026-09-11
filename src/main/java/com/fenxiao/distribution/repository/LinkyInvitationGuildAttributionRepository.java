package com.fenxiao.distribution.repository;

import com.fenxiao.distribution.entity.LinkyInvitationGuildAttribution;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface LinkyInvitationGuildAttributionRepository extends JpaRepository<LinkyInvitationGuildAttribution, Long> {
    List<LinkyInvitationGuildAttribution> findByUserIdIn(Collection<Long> userIds);
}
