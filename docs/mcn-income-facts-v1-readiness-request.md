# BANDEIRA → MCN：Timo / Linky 收入事实 V1 对接请求

请把以下内容作为给 MCN 中台对接负责人的提示词完整转交。

---

你现在是 **MCN 中台** 的对外接口与数据治理负责人。请为 BANDEIRA 项目提供 **Timo 与 Linky 平台收入事实** 的生产对接方案。

## 一、业务目标与明确边界

BANDEIRA 已完成以下能力并已上线：

1. Timo、Linky 平台账号绑定时，由 MCN 返回权威公会归属事实进行核验；
2. MCN 统一公会目录同步；
3. BANDEIRA 不可变“收入原始账本”基础设施：可接收投递批次、收入事实及其修订，保存原始证据、哈希、接收时间与账号归属解析结果。

本期目标是由 MCN 提供**平台收入事实**，让 BANDEIRA 建立可对账的原始账本和后续影子账本。

MCN 是平台事实的唯一权威来源；BANDEIRA 是邀请码关系、奖励资格、奖励规则、分成、钱包、提现和运营人工处理的唯一业务决策方。

因此，MCN 本期不得也不需要：

- 根据 BANDEIRA 邀请码、上级、导师、公会归属配置或奖励规则推导收益归属；
- 接收或依赖 BANDEIRA `userId`、手机号、WhatsApp、邀请码作为平台账号匹配依据；
- 直接调用 Linky/Timo 官方以外的 BANDEIRA 业务系统来决定金额；
- 调用 BANDEIRA 当前内部标准化入口或复用既有 Timo 核验、Linky 核验、公会目录的 Credential / HMAC Secret。

## 二、BANDEIRA 的账本规则

请基于以下规则设计接口：

1. 平台主标识：Timo 使用官方 12 位 `timo_id`；Linky 使用已确认的主标识 `sid`。不得使用昵称、手机号、WhatsApp 或邀请码替代。
2. 一条平台流水必须有稳定的 `sourceEventId`；同一流水发生金额、结算状态或业务事实变动时，MCN 必须给出新的 `sourceRevision`，而非静默覆盖旧事实。
3. 收入、更正、撤销均是新事实。更正或撤销须提供 `originalSourceEventId` 指向原流水。
4. BANDEIRA 会保存未找到已核验平台绑定的事实，并标记为待处理；请不要因为未提供 BANDEIRA 用户资料而拒绝返回该事实。
5. 初期所有事实仅进入原始账本和影子对账；BANDEIRA 不会把任一回包直接转换为奖励、可提现余额或付款。
6. 所有时间请用 ISO-8601、UTC 且带 `Z` / 偏移量；金额请保持原始币种与精度，不在 MCN 或 BANDEIRA 入站层换汇。

## 三、请 MCN 给出的正式答复

请按下面的章节答复，并提供不含真实密钥和个人信息的 JSON 示例。

### A. 推荐同步方式

请在下面两种方式中明确推荐一种主方案，并说明可靠性、实时性、重放与恢复策略；另一种可作为灾备或补数方案：

- **推送**：MCN 在收入事实新增/修订时主动向 BANDEIRA 投递；
- **拉取**：BANDEIRA 按游标、更新时间或水位线从 MCN 拉取增量。

无论选择哪种方案，都必须支持：实时增量、按游标或时间窗回补、长时间断流后的恢复、稳定排序、重复请求安全、分页和可审计 Request ID。

### B. 专属生产鉴权与调用条件

请提供：

1. BANDEIRA 专属的收入事实 Credential ID、最小只读 / 最小投递 Scope、安全交付、轮换、吊销和泄露应急流程；
2. HMAC 或其他签名方案：请求头、算法、签名原文的标准化规则、时间窗、防重放、验收向量；
3. 限流、超时、重试退避、429 / 5xx / `source_stale` / 部分失败的精确定义；
4. 生产基地址、版本路径、MCN 侧固定出口 IP（若为推送）、BANDEIRA 是否需提供回调地址白名单；
5. Request ID、Trace ID 的传递与双方排障方式。

不得复用已发放给 Timo 绑定核验、Linky 绑定核验或统一公会目录的任何 Credential、Secret、配额或审计链路。

### C. 统一收入事实字段契约

请给出 Timo、Linky 通用的字段表、类型、是否必填、枚举含义、取值来源和不可变性。至少应覆盖：

```json
{
  "deliveryId": "mcn-delivery-unique-id",
  "platformCode": "TIMO | LINKY",
  "sourceEventId": "stable-platform-income-event-id",
  "sourceRevision": "immutable-revision-or-version",
  "originalSourceEventId": "required-for-adjustment-or-reversal",
  "platformUserId": "timo_id or linky sid",
  "eventType": "INCOME | ADJUSTMENT | REVERSAL",
  "settlementStatus": "PENDING | SETTLED | REVERSED | CANCELLED",
  "amount": "decimal without loss of precision",
  "currencyCode": "ISO-4217 code",
  "occurredAt": "UTC ISO-8601 timestamp",
  "settledAt": "UTC ISO-8601 timestamp or null",
  "sourceUpdatedAt": "UTC ISO-8601 timestamp",
  "guildId": "MCN authoritative guild id when applicable",
  "sourcePayload": "source evidence permitted for BANDEIRA retention"
}
```

还请明确：

1. `amount` 是毛收入、净收入、佣金、可结算收入还是其他口径；是否包含税费、平台扣费、退款前后差异；
2. 一笔收入在 `PENDING` → `SETTLED`、更正、退款、撤销时，ID、修订号、金额正负号和关联原单如何变化；
3. 能否同一平台账号、多币种、多公会、跨日结算；如能，如何表达；
4. `sourcePayload` 中哪些字段可供 BANDEIRA 审计保存，哪些字段必须脱敏或不得交付；
5. 数据延迟 SLA、历史数据保留期、最早可回补时间和最终一致性窗口。

### D. 增量、分页、回补与对账

请提供：

1. 增量读取 / 投递的游标、watermark 或时间窗设计，及稳定排序字段；
2. 首次历史回补、每日补数、人工指定区间回补的接口与最大范围；
3. 分页响应中 `nextCursor`、`hasMore`、快照时间和总量是否可用；
4. BANDEIRA 对账所需聚合接口或可复算字段：按平台、日期、币种、账号、公会、状态汇总的笔数与金额；
5. 事实被延迟发现、重复推送、顺序颠倒、遗漏或撤销时的标准处置方式。

### E. 受控生产联调

请提供受控、可审计的生产联调方案，不输出真实用户个人资料：

1. 每个平台至少准备：一笔已结算收入、一笔待结算收入、一笔更正或撤销、一个无 BANDEIRA 绑定账号；
2. 每个样本提供平台账号主标识、流水 ID、修订号、预期金额/币种/状态、Request ID 或可检索证据；
3. 允许 BANDEIRA 验证首次接收、重复投递、补数、未匹配留存与事实修订；
4. 明确联调时间窗、监控联系人、失败回滚与数据清理边界。

## 四、BANDEIRA 已实现的接收语义

BANDEIRA 的当前原始账本会按以下语义处理 MCN 数据：

- 相同 `sourceSystem + deliveryId` 且载荷相同：识别为重复批次，不重复写入；
- 相同 `sourceSystem + platformCode + sourceEventId + sourceRevision` 且事实内容相同：识别为重复事实；
- 相同事实键但内容不同：拒绝并要求以新的 `sourceRevision` 重投，避免历史证据被覆盖；
- 无已核验平台绑定：照常保存，标记 `UNMATCHED`；
- 已核验平台绑定：标记 `BOUND`，但不会在本期发奖。

该入口目前是 BANDEIRA 内部标准化接收层，尚未对 MCN 开放公网调用。请先回复正式协议；BANDEIRA 将据此建设 MCN 专属外部适配器、专属凭据和生产回调 / 拉取通道。

请在回复末尾列出：**已可提供、需要 BANDEIRA 确认、尚未具备、预计交付时间** 四类事项。
