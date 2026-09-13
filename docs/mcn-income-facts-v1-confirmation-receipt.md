# BANDEIRA → MCN：收入事实 V1 口径确认回执

请把以下内容完整转交 MCN 中台。

---

BANDEIRA 已完成对《MCN → BANDEIRA：Timo / Linky 收入事实 V1 准备度答复》的业务与技术评审。现确认以下 V1 口径，并据此开始 BANDEIRA 侧适配开发。

## 一、BANDEIRA 确认接受的 V1 边界

1. **同步方式**：接受以拉取为主、推送作为后续灾备的方案。BANDEIRA 将按 opaque cursor 消费单平台快照页，并在完整、成功处理后才推进游标。
2. **事实粒度**：接受 `ACCOUNT_GUILD_DAY`。V1 的权威对象是“平台账号 × MCN 权威公会 × 平台业务日”，不将其解释为官方订单或单笔交易流水。
3. **主标识**：Timo 使用官方 12 位 `timo_id`；Linky 使用 `sid`。BANDEIRA 不会以昵称、手机号、WhatsApp、邀请码或站内 `userId` 请求或匹配收入事实。
4. **金额与单位**：接受 `currencyCode=XXX` 与 `amountUnit=TIMO_DIAMOND / LINKY_DIAMOND`。原始账本层不换汇，不将钻石解释为法币、佣金、可提现余额或已付款金额。
5. **修订模型**：接受同一 `sourceEventId` 下以新的 `sourceRevision` 追加事实。金额为该修订的日绝对总额；影子账本仅选择该事实的最新有效修订，绝不累加多个 revision。`ADJUSTMENT` / `REVERSAL` 必须可追溯至原始事实。
6. **未匹配账号**：没有已核验 BANDEIRA 平台绑定的账号仍须正常返回。BANDEIRA 将保留原始事实并标记为 `UNMATCHED`，不会因此要求 MCN 获取站内用户资料。
7. **时间语义**：接受 `businessDate`、`sourceTimezone`、`periodStart`、`periodEnd` 共同表达业务日边界；所有传输时间使用带 `Z` / offset 的 UTC ISO-8601 格式。
8. **结算语义**：BANDEIRA 将把 V1 的 `SETTLED` 理解为“MCN 日事实已经定稿”，并在产品与运营界面使用“已定稿日事实”表述；它不表示平台现金付款、BANDEIRA 发奖、用户可提现或 PIX 已支付。

## 二、BANDEIRA 正在进行的适配

BANDEIRA 将在专属外部适配器中：

- 将收入事实时间统一为 UTC `Instant` 语义；
- 将 `factGranularity`、`amountUnit`、`businessDate`、业务日区间、来源时区、定稿依据、`snapshotAt` 和 `sourceWatermark` 作为原始账本 / 同步记录的一等字段；
- 建立每个平台独立的游标、快照页、拉取批次、失败退避与人工回补记录；
- 使用 MCN 指定的 HMAC 请求头与签名串，专属配置默认关闭；
- 保持收入事实仅进入原始账本与影子对账，不连接奖励、钱包、提现或付款流程。

BANDEIRA 当前的内部标准化账本入口不对 MCN 直接开放。请不要在未收到 BANDEIRA 专属公网适配器地址、凭据交付确认和联调窗口前主动推送或调用任何 BANDEIRA 地址。

## 三、请 MCN 按确认口径推进的交付

请按你方答复中的预计计划提供：

1. `POST /api/external/income-facts/v1/changes/query`；
2. `POST /api/external/income-facts/v1/reconciliation/query`；
3. `income_facts.read` 与 `income_facts.reconciliation.read` 两个独立 Scope；
4. 不含真实 Secret 的 HMAC 验收向量、稳定 cursor 重试样本和响应 JSON；
5. Timo、Linky 各自的受控生产联调样本，覆盖 final、provisional、adjustment / reversal 与未绑定账号；
6. 专属 Credential 与 HMAC Secret 的安全交付方式、启用时间及可审计 Request ID。

请在接口实现完成后回复“生产接入规范”，其中必须包含：完整字段表、错误码和 `sourceStatus=STALE` 处理、分页 / 补数示例、对账响应示例、样本可用时间与联调联系人。

## 五、生产只读交付后的补充确认

BANDEIRA 已收到 MCN 收入事实 V1 的受限生产只读交付包，并确认不会复制或回传其中的生产 HMAC Secret、受控样本账号或事实内容。

1. `MCN_INCOME_FACTS_ENABLED` 将继续保持 `false`，不启动持续消费者；奖励、分账、钱包、提现及付款仍保持断开。
2. BANDEIRA 将先完成非生产 HMAC 验收向量测试、受控同 Request ID 重试、分页游标留痕及对账读取适配，再进行双方约定的只读窗口。
3. BANDEIRA 事故联系人为 **Eastion（项目接手负责人）**，使用既有授权 MCN 运营协作通道；双方以 `X-Request-Id` 关联排障。
4. 对外联调回执只会包含 Request ID、时间、HTTP 状态、来源状态、截短交付哈希、延迟、游标持久化、事实数量、未匹配数量及对账结论，不含事实、账号、签名、cursor 原值或 Secret。
5. BANDEIRA 生产服务器当前确认的 IPv4 对外出口为 `47.82.172.110`。MCN 如需追加网络 allowlist，请仅允许该出口并通过既有授权协作通道确认。

## 四、上线门禁

双方在以下条件均满足前，不开启任何真实奖励、分账、可提现余额或付款：

1. 原始账本对首次拉取、同 cursor 重试、重复事实、新 revision、撤销和未匹配账号均留痕正确；
2. Timo、Linky 各有至少一轮受控生产事实与 MCN 对账一致；
3. 数据断流、`429`、`503`、`STALE`、游标失效与历史回补均已演练；
4. 财务和业务已签字确认影子账本规则与差异处理方式。
