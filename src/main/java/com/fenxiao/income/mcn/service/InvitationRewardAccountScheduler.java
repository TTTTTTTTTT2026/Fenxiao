package com.fenxiao.income.mcn.service;

import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@Profile("!test")
public class InvitationRewardAccountScheduler {
    private final InvitationRewardAccountService accounts;
    private final VerificationCampaignService campaigns;

    public InvitationRewardAccountScheduler(InvitationRewardAccountService accounts, VerificationCampaignService campaigns) {
        this.accounts = accounts; this.campaigns = campaigns;
    }

    @Scheduled(cron = "${app.invitation-reward.release-cron:0 * * * * *}", zone = "UTC")
    public void releaseDue() { accounts.releaseDue(); campaigns.processPending(); campaigns.releaseDue(); }

    @Scheduled(cron = "${app.invitation-reward.backfill-cron:0 10 10 * * *}", zone = "UTC")
    public void backfill() { accounts.backfill(); }
}
