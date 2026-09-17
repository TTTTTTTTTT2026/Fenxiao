package com.fenxiao.incentive.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Local re-evaluation only. The authoritative income facts have already been retained by BANDEIRA. */
@Component
public class UserGradeRefreshScheduler {
    private final UserGradeAdminService grades;
    public UserGradeRefreshScheduler(UserGradeAdminService grades) { this.grades = grades; }

    @Scheduled(cron = "${app.user-grade.refresh-cron:0 25 * * * *}")
    public void refresh() { grades.refreshAllVerifiedUsers(); }
}
