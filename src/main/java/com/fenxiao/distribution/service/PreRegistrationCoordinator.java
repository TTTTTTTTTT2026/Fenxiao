package com.fenxiao.distribution.service;

import com.fenxiao.distribution.repository.SubordinatePreRegistrationRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.time.*;

@Component
public class PreRegistrationCoordinator {
    private static final Logger log=LoggerFactory.getLogger(PreRegistrationCoordinator.class);
    private final SubordinatePreRegistrationRepository applications;
    private final PreRegistrationWorker worker;
    private final Clock clock;
    private final boolean scheduled;
    public PreRegistrationCoordinator(SubordinatePreRegistrationRepository applications,PreRegistrationWorker worker,
            Clock clock,@Value("${app.pre-registration.scheduler-enabled:true}") boolean scheduled) {
        this.applications=applications;this.worker=worker;this.clock=clock;this.scheduled=scheduled;
    }
    public void process(Long id) {
        var app=applications.findById(id).orElseThrow();
        if(!app.pending()) return;
        try { worker.verify(id,app.getRevision()); }
        catch(PreRegistrationWorker.Deferred exception) { worker.deferred(id,app.getRevision(),exception.code); }
        catch(RuntimeException exception) {
            // Never expose upstream messages, identifiers or request credentials through list/audit/log.
            log.warn("Pre-registration verification deferred: applicationId={}, type={}",id,exception.getClass().getSimpleName());
            worker.deferred(id,app.getRevision(),"SOURCE_UNAVAILABLE");
        }
    }
    @Scheduled(fixedDelayString="${app.pre-registration.poll-interval:60000}")
    public void poll() {
        if(!scheduled) return;
        for(Long id:applications.findDue(LocalDateTime.now(clock),PageRequest.of(0,20))) {
            try {process(id);} catch(RuntimeException exception) {
                log.warn("Pre-registration processing deferred: applicationId={}, type={}",id,exception.getClass().getSimpleName());
            }
        }
    }
}
