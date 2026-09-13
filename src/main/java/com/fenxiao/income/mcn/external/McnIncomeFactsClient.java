package com.fenxiao.income.mcn.external;

public interface McnIncomeFactsClient {
    /** True once the dedicated credential is present; it does not mean scheduled pulling is enabled. */
    boolean enabled();
    McnIncomeFactsPage query(McnIncomeFactsQuery query);
    McnIncomeFactsQueryResult query(McnIncomeFactsQuery query, McnIncomeFactsRequestContext context);
    McnIncomeFactsReconciliationResult reconcile(McnIncomeFactsReconciliationQuery query);
}
