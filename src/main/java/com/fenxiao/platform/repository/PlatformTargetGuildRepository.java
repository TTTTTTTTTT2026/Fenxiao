package com.fenxiao.platform.repository;

import com.fenxiao.platform.entity.PlatformTargetGuild;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlatformTargetGuildRepository extends JpaRepository<PlatformTargetGuild, Long> {
    List<PlatformTargetGuild> findByPlatformCodeOrderByCountryCodeAscOfficialGuildIdAsc(String platformCode);
}
