package com.fenxiao.income.mcn.service;

import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@Profile("!test")
public class InvitationRewardAccountScheduler {
    private final InvitationRewardAccountService accounts;

    public InvitationRewardAccountScheduler(InvitationRewardAccountService accounts) {
        this.accounts = accounts;
    }

    @Scheduled(cron = "${app.invitation-reward.release-cron:0 * * * * *}", zone = "UTC")
    public void releaseDue() { accounts.releaseDue(); }

    @Scheduled(cron = "${app.invitation-reward.backfill-cron:0 10 10 * * *}", zone = "UTC")
    public void backfill() { accounts.backfill(); }
}
