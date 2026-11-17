package com.fenxiao.distribution.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import java.util.Arrays;

@Service
@Transactional(propagation = Propagation.MANDATORY)
public class RegistrationClaimGuard {
    private final JdbcTemplate jdbc;
    public RegistrationClaimGuard(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    public void lock(String... keys) {
        Arrays.stream(keys).map(key -> key.startsWith("PHONE:") ? "PHONE:" + key.substring(6).replaceAll("[^0-9]", "") : key).mapToInt(key -> Math.floorMod(key.hashCode(), 64)).distinct().sorted()
                .forEach(slot -> jdbc.queryForObject("SELECT slot_id FROM registration_claim_mutex WHERE slot_id=? FOR UPDATE", Integer.class, slot));
    }
    public void assertAccountAvailable(Long userId, String platform, String account) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM subordinate_pre_registration WHERE active_account=? AND user_id<>?",
                Integer.class, platform + ":" + account, userId);
        if (count != null && count > 0) throw new IllegalStateException("PRE_ACCOUNT_RESERVED");
    }
}
