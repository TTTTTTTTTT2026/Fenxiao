package com.fenxiao.income.mcn.external;

public interface McnIncomeFactsClient {
    /** Legacy platform-wide recovery cannot operate against account-scoped V2. */
    default boolean accountScopedV2() { return false; }
    /** True once the dedicated credential is present; it does not mean scheduled pulling is enabled. */
    boolean enabled();
    McnIncomeFactsPage query(McnIncomeFactsQuery query);
    McnIncomeFactsQueryResult query(McnIncomeFactsQuery query, McnIncomeFactsRequestContext context);
    McnIncomeFactsReconciliationResult reconcile(McnIncomeFactsReconciliationQuery query);
}
