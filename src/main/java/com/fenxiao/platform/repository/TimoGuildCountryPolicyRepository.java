package com.fenxiao.platform.repository;

import com.fenxiao.platform.entity.TimoGuildCountryPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;

public interface TimoGuildCountryPolicyRepository extends JpaRepository<TimoGuildCountryPolicy, String> {
    @Override @EntityGraph(attributePaths = "countryCodes")
    List<TimoGuildCountryPolicy> findAll();
    @Query("select p from TimoGuildCountryPolicy p join p.countryCodes c where c = :country")
    Optional<TimoGuildCountryPolicy> findForCountry(@Param("country") String country);
}
