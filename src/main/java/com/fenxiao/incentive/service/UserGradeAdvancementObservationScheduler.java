package com.fenxiao.incentive.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Periodically refreshes local Platinum-observation results; it never calls MCN or creates money records. */
@Component
public class UserGradeAdvancementObservationScheduler {
    private final UserGradeAdvancementReviewService reviews;
    public UserGradeAdvancementObservationScheduler(UserGradeAdvancementReviewService reviews) { this.reviews = reviews; }

    @Scheduled(cron = "${app.user-grade.platinum-observation-refresh-cron:0 35 * * * *}")
    public void refresh() { reviews.refreshOpenReviews(); }
}
