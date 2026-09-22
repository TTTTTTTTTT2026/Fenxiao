package com.fenxiao.income.mcn.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/** Runs the non-financial projection only after the immutable MCN receipt has committed. */
@Component
public class McnIncomeBusinessFactPipelineListener {
    private static final Logger log = LoggerFactory.getLogger(McnIncomeBusinessFactPipelineListener.class);
    private final McnIncomeBusinessFactPipeline pipeline;

    public McnIncomeBusinessFactPipelineListener(McnIncomeBusinessFactPipeline pipeline) {
        this.pipeline = pipeline;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void afterMcnFactsAccepted(McnIncomeFactsAcceptedEvent event) {
        try {
            pipeline.refresh(event.platformCode(), event.businessDates());
        } catch (RuntimeException exception) {
            // MCN evidence is already committed at this point. Do not turn a local projection
            // failure into data loss or a false MCN sync failure.
            log.error("MCN business-fact pipeline failed after accepted {} facts for {}: {}",
                    event.businessDates().size(), event.platformCode(), exception.getMessage(), exception);
        }
    }
}
