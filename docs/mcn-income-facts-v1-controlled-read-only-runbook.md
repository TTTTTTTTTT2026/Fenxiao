# MCN 收入事实 V1：受控生产只读联调手册

本手册仅用于 MCN 与 BANDEIRA 约定的生产只读联调。它不授权开启奖励计算、分账、钱包入账、提现或付款。

## 固定门禁

1. `MCN_INCOME_FACTS_ENABLED=false`：持续拉取消费者必须始终关闭。
2. 仅在双方确认的联调窗口内，短时设置 `MCN_INCOME_FACTS_CONTROLLED_READ_ONLY_ENABLED=true`。
3. 生产 Credential ID 与 HMAC Secret 仅由服务器受限 `.env` 注入；不得进入 Git、终端回显、接口响应、日志、工单或截图。
4. 操作接口需要后台 `finance` 或 `super_admin` 会话；它们没有开启持续消费者的能力。
5. 联调结束后立即把 `MCN_INCOME_FACTS_CONTROLLED_READ_ONLY_ENABLED` 改回 `false`，并重新创建后端容器；`MCN_INCOME_FACTS_ENABLED` 不得变更为 `true`。

## MCN 交付确认

- 已接收七份受限交付文件；未复制生产 Secret。
- BANDEIRA 事故联系人：**Eastion（项目接手负责人）**，通过既有授权运营协作通道联络。
- MCN 按 `X-Request-Id` 协查；BANDEIRA 对外只反馈 Request ID、请求时间、HTTP 状态、来源状态、截短交付哈希、延迟、游标持久化结果、事实数量及对账结果。

## 受控请求接口

`POST /admin/income-facts/controlled-read-only/changes`

请求示例（不使用真实样本账号，也不把返回事实复制到外部渠道）：

```json
{
  "platformCode": "LINKY",
  "cursor": null,
  "businessDateFrom": "联调确认的已定稿业务日",
  "businessDateTo": "联调确认的已定稿业务日",
  "pageSize": 200
}
```

首次调用返回的 `requestId`、`nextCursor` 仅可用于本次受控操作。为验证 MCN 幂等交付，使用**相同**日期、平台、页大小、输入游标和 `requestId` 重发；服务会产生新 nonce、时间戳及签名。响应不返回事实、账号或签名。

以返回的 `nextCursor` 读取下一页时，使用新的 `requestId`；再以相同输入 cursor、另一新的 `requestId` 重读一次，验证交付稳定。每次结果都会在 `mcn_income_controlled_read_run` 留下不含事实的审计记录，含请求体哈希、输入 / 输出游标、截短交付哈希及接收计数。

`POST /admin/income-facts/controlled-read-only/reconciliation`

```json
{
  "platformCode": "LINKY",
  "businessDateFrom": "联调确认的已定稿业务日",
  "businessDateTo": "联调确认的已定稿业务日",
  "guildIds": []
}
```

此接口只比较 MCN 的最新 revision 聚合，与 BANDEIRA 已保留的原始账本聚合；返回分组数量及 `MATCHED` / `MISMATCH`，不会返回任何平台账号或收入事实。只有完整读取该业务日的受控页面后，`MATCHED` 才有意义。

## 最小验收顺序

1. 安装独立收入事实凭据，保持两个执行开关均为 `false`，确认服务健康。
2. 用交付的非生产 HMAC 验收向量运行自动化测试。
3. 仅打开受控只读开关，执行一页已定稿的 Linky 日期查询。
4. 以相同 Request ID、相同请求体重试该页；确认交付哈希、事实数量及游标哈希一致。
5. 按 next cursor 分页至终页；确认终页 `hasMore=false` 且 next cursor 非空且已审计留存。
6. 对同一 Linky 日期调用 reconciliation；完成全页读取后确认账本聚合结果。
7. 读取 MCN 指定的当前 Timo 日期；预期 `STALE` 与 `retryAfterSeconds=300`，不得把它解释为零收入。
8. 从完整 Linky 页中在 BANDEIRA 原始账本识别至少一条 `UNMATCHED` 事实，仅上报数量与结果，不上报账号。
9. 关闭受控只读开关，保留持续消费者关闭状态，提交脱敏联调回执。

## 明确禁止

- 不得将 `MCN_INCOME_FACTS_ENABLED` 设为 `true`。
- 不得以 Timo 当前 `STALE / PROVISIONAL` 结果发奖或结算。
- 不得把 `ACCOUNT_GUILD_DAY` 事实解释为订单、法币、佣金、可提现余额或付款证明。
- 不得将收入事实接入奖励、钱包、提现及付款路径。
