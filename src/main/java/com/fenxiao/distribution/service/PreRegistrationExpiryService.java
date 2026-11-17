package com.fenxiao.distribution.service;

import com.fenxiao.distribution.repository.SubordinatePreRegistrationRepository;
import com.fenxiao.user.repository.UserDistributionProfileRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;

@Service
@Transactional
public class PreRegistrationExpiryService {
    private final SubordinatePreRegistrationRepository applications;
    private final UserDistributionProfileRepository users;
    private final JdbcTemplate jdbc;
    private final Clock clock;
    public PreRegistrationExpiryService(SubordinatePreRegistrationRepository applications,
                                         UserDistributionProfileRepository users, JdbcTemplate jdbc, Clock clock) {
        this.applications=applications; this.users=users; this.jdbc=jdbc; this.clock=clock;
    }
    // Caller has already acquired the phone mutex. Claim and expiry share the profile lock.
    public void expireForPhone(String phone) {
        var user = users.findByPhoneNumberForClaim(phone, PhoneAuthService.alternatePhone(phone)).orElse(null);
        if (user == null) return;
        var ids = jdbc.queryForList("SELECT id FROM subordinate_pre_registration WHERE user_id=? AND status='PENDING' AND expires_at<=?",
                Long.class, user.getUserId(), LocalDateTime.now(clock));
        for (Long id : ids) {
            var app=applications.lockById(id).orElseThrow();
            if (app.pending() && !LocalDateTime.now(clock).isBefore(app.getExpiresAt())) {
                app.finish("EXPIRED", "EXPIRED", LocalDateTime.now(clock));
                user.expirePreRegistration();
                jdbc.update("INSERT INTO subordinate_pre_registration_attempt(application_id,reason_code,checked_at) VALUES (?,?,?)",
                        id, "EXPIRED", LocalDateTime.now(clock));
            }
        }
        users.flush(); applications.flush();
    }
    public void recordPhoneClaim(Long userId) {
        jdbc.update("INSERT INTO subordinate_pre_registration_attempt(application_id,reason_code,checked_at) SELECT id,'PHONE_CLAIMED',? FROM subordinate_pre_registration WHERE user_id=?",
                LocalDateTime.now(clock),userId);
    }
}
