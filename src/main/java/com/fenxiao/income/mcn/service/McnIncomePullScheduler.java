package com.fenxiao.income.mcn.service;

import com.fenxiao.income.mcn.external.McnIncomeFactsProperties;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Scheduler is inert until the dedicated MCN credential and feature flag are both configured. */
@Component
public class McnIncomePullScheduler {
    private final McnIncomeFactsProperties properties;
    private final McnIncomePullService pullService;

    public McnIncomePullScheduler(McnIncomeFactsProperties properties, McnIncomePullService pullService) {
        this.properties = properties;
        this.pullService = pullService;
    }

    @Scheduled(fixedDelayString = "${app.mcn-income-facts.sync-interval:300000}")
    public void pullIncrementalFacts() {
        if (!properties.isContinuousPullEnabled()) return;
        pullService.pullNextPage("TIMO");
        pullService.pullNextPage("LINKY");
    }
}
