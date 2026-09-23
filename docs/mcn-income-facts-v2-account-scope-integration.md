# MCN 收入事实 V2 账号范围接入

## 目标

- 只读取 `platform_account_binding` 中 `VERIFIED` 的 Timo / Linky 平台账号。
- 单账号独立保存“收入同步进度”；新核验账号以空进度开始补取 MCN 当前可提供的历史。
- 每次 V2 响应必须回显完全相同的账号范围；事实中的平台账号 ID 再做一次本地校验。
- 仅在分页事实成功写入本地收入事实记录后推进对应账号的同步进度。
- 空账号范围是显式空查询，不得退化成全平台读取。
- 收入同步只获取和整理事实，不启用奖励、钱包、提现、付款或自动发奖。

## V2 接口

- Changes: `POST /api/external/income-facts/v2/changes/query`
- Reconciliation: `POST /api/external/income-facts/v2/reconciliation/query`
- Scope 分别为 `income_facts.account.read` 与 `income_facts.account.reconciliation.read`。
- Timo 平台账号 ID 为 12 位数字；Linky 为 8 位数字，保留前导零；每次最多 100 个账号。
- 请求签名仍使用原始 JSON Body 字节及 `McnIncomeFactsRequestSigner`。
- 生产配置只从 Secret 环境变量读取 V2 凭据：`MCN_INCOME_FACTS_V2_CREDENTIAL_ID`、`MCN_INCOME_FACTS_V2_HMAC_SECRET`。不得把 Secret 写入仓库、日志、数据库或普通配置文件。

## 本地实现

- `McnIncomeFactsHttpClient` 只调用 V2 路径，并强制发送 `platformUserIds`。
- 响应的 `queryScope` 必须回显 `PLATFORM_USER_IDS`、规范化账号列表、数量与 64 位范围摘要；每条事实还必须属于该请求范围。
- 新表 `mcn_income_account_sync_checkpoint` 按平台账号隔离进度；旧平台级同步摘要不保存 V2 继续读取位置。
- 按账号持久化 MCN 返回的 `historyStart`。当前没有权威平台账号生命周期起始日，历史完整度标为 `UNKNOWN`；`historyStart` 以前是“不可获取”，不能记作零收入。以后仅有权威起始日时，早于边界标 `PARTIAL`，不早于边界才标 `COMPLETE`。公会加入日、分销平台注册或绑定日不能代替账号起始日。
- 仅接受 MCN 在 `READY` 页面返回的交付编号、快照时间；不再自行生成。`STALE` 不入账、不推进进度；对账 `READY` 也必须有 MCN 快照编号及时间。
- 对账逐组复算 MCN V2 的 SHA-256 校验值：按事实 ID 升序，以 `U+001F` 连接 ID、修订、规范化金额，以 LF 连接行；同时核验数量与绝对金额合计。只有三项一致才标为 `MATCHED`。
- 账号继续读取位置返回 HTTP 410 时，弃用该位置，从 `historyStart` 到当前业务日按不超过 31 日的窗口补取。每窗读至末页，保存终页位置并做同账号、同日期对账；不一致则重读该窗。所有窗口通过后，从空位置启动无日期范围的持续流，依靠事实 ID 与修订幂等去重。日期窗口位置绝不用于无日期查询。
- 自动收入同步计划为北京时间每日 17:15；仅在收入同步开关和专用 V2 凭据均有效时执行。
- 运营后台的读取同步状态展示每个平台“已核验 / 已读取、补取中 / 失败”的账号数量；平台最近成功时间只是最近一页的摘要，不代表所有账号都已同步完毕。
- 受控读取和对账自动使用当前已核验账号范围，超过 MCN 单批 100 个上限时失败关闭。
- 生产接入前保持 `MCN_INCOME_FACTS_ENABLED=false` 与 `MCN_INCOME_FACTS_CONTROLLED_READ_ONLY_ENABLED=false`；不得直接复用 V1 凭据。

## 上线前核查

1. MCN 的权威历史覆盖下限当前为 `2026-08-01`；不能据此承诺更早账号的完整生命周期收入。
2. 现网 V1 全平台收入消费者应先确认关闭；代码切换不等于现网运行状态已改变。
3. 本地后端自动化测试及日期补取—对账全链路演练通过后，方可开启 V2 持续收入同步；奖励、钱包、提现及付款开关继续保持关闭。
