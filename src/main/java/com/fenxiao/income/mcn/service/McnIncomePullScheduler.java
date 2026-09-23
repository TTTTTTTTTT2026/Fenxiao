package com.fenxiao.income.mcn.service;

import com.fenxiao.income.mcn.external.McnIncomeFactsProperties;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Scheduler remains inert until MCN reads can be constrained to registered platform accounts. */
@Component
public class McnIncomePullScheduler {
    private final McnIncomeFactsProperties properties;
    private final McnIncomePullService pullService;

    public McnIncomePullScheduler(McnIncomeFactsProperties properties, McnIncomePullService pullService) {
        this.properties = properties;
        this.pullService = pullService;
    }

    @Scheduled(cron = "${app.mcn-income-facts.sync-cron:0 15 17 * * *}",
            zone = "${app.mcn-income-facts.sync-zone:Asia/Shanghai}")
    public void pullIncrementalFacts() {
        if (!properties.isRegisteredUserScopedPullEnabled()) return;
        pullService.pullAvailablePages("TIMO");
        pullService.pullAvailablePages("LINKY");
    }
}
