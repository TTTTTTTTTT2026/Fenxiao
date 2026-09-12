package com.fenxiao.income.mcn.domain;

/**
 * The source's business change. A correction or reversal is a new immutable fact,
 * never an update to the income fact it refers to.
 */
public enum McnIncomeEventType {
    INCOME,
    ADJUSTMENT,
    REVERSAL
}
