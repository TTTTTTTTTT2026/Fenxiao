package com.fenxiao.income.mcn.service;

import com.fenxiao.income.mcn.external.McnIncomeFactsClient;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Scheduler is inert until the dedicated MCN credential and feature flag are both configured. */
@Component
public class McnIncomePullScheduler {
    private final McnIncomeFactsClient client;
    private final McnIncomePullService pullService;

    public McnIncomePullScheduler(McnIncomeFactsClient client, McnIncomePullService pullService) {
        this.client = client;
        this.pullService = pullService;
    }

    @Scheduled(fixedDelayString = "${app.mcn-income-facts.sync-interval:300000}")
    public void pullIncrementalFacts() {
        if (!client.enabled()) return;
        pullService.pullNextPage("TIMO");
        pullService.pullNextPage("LINKY");
    }
}
