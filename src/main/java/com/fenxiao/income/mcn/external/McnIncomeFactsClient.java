package com.fenxiao.income.mcn.external;

public interface McnIncomeFactsClient {
    boolean enabled();
    McnIncomeFactsPage query(McnIncomeFactsQuery query);
}
