# BANDEIRA → MCN：Timo 一期生产联调准备请求

你现在是 MCN 中台 Timo 外部接口的对接负责人。

BANDEIRA 已确认第一期采用原始规则 A：

仅当 Timo 账号属于用户归属国家对应的目标公会，且官方正式入会时间与 BANDEIRA 的账号绑定提交时间绝对相差不超过严格 24 小时时，才允许通过绑定核验。

如果时间差超过严格 24 小时、无法提供正式入会时间、属于其他目标公会，或存在多公会冲突，BANDEIRA 均视为不通过或进入人工复核。首期不调整为“只要当前在目标公会即可通过”的宽松规则。

本期仅接入 Timo 只读归属核验，不包含收益读取、CRM 写入、代办绑定、真实发奖、Linky 对接或任何官方平台凭据。

请协助补齐以下生产联调前置信息。请勿在回复正文中提供任何生产 Secret、Token、Cookie、手机号或真实敏感资料。

## 一、生产访问配置

请确认：

1. BANDEIRA 应调用的正式 HTTPS API 基地址。
2. TLS 证书域名及最低 TLS 版本要求。
3. 是否启用 IP 白名单；如启用，请说明需要 BANDEIRA 提供的出口 IP 格式、配置周期及生效确认方式。
4. BANDEIRA 专属只读 Credential 的申请流程：
   - Credential ID；
   - 仅允许 Scope：`timo.joined_guild_at.read`；
   - Secret 的安全交付方式；
   - 吊销与轮换流程。
5. 双方联调主备联系人、联调窗口和故障升级渠道。

## 二、请求签名验收向量

BANDEIRA 将严格按以下方式调用：

```http
POST /api/external/timo/v2/joined-guild-at/batch-query
```

请提供一个不含生产密钥、不含真实用户信息的 HMAC 验收向量，用于 BANDEIRA 单元测试验证签名实现。请包含：

```text
测试 Secret（必须是虚构、仅用于文档测试的值）
原始请求 Body 字节对应的 UTF-8 文本
X-MCN-Timestamp
X-MCN-Nonce
X-Request-Id
X-Idempotency-Key
SHA-256(rawBody) 预期值
七行签名原文
HMAC-SHA256 小写十六进制签名预期值
```

## 三、A 规则下的联调样本

BANDEIRA 需要验证“通过、拒绝、异常”三类结果。请安排或说明以下只读生产联调样本：

1. `found / 可通过` 样本

   请提供一个已获授权的 12 位 Timo ID、所属目标公会 ID、国家和 `joinedGuildAtBj`。

   该样本需能与 BANDEIRA 预先约定的绑定提交时间满足“绝对时间差不超过严格 24 小时”的规则。

2. `not_found / 拒绝` 样本

   请在完整且新鲜名册中确认一个不会命中目标公会的测试值；不需要提供用户资料。

3. `error / 不可重试` 样本

   如不适合在生产制造异常，请明确推荐以 BANDEIRA 本地 Mock 和契约测试覆盖哪些错误码，例如：

   - `expected_guild_mismatch`
   - `subject_multiple_guilds`
   - `formal_join_time_missing`

4. `source_stale / 可重试` 样本

   无需破坏生产服务。请确认 BANDEIRA 采用本地 Mock、HTTP 重试和契约测试覆盖该场景是否符合联调要求。

## 四、业务字段与判定确认

请再次确认以下规则：

1. `subjectId` 即 Timo 主标识 `timo_id`。
2. 正常业务账号必须为 12 位纯数字且首位不为 `0`。
3. `expectedGuildId` 与 `expectedCountry` 均为必填。
4. 国家映射固定为：
   - `MX` → `Mexico` → `22000408`
   - `ID` → `Indonesia` → `11003905`
   - `BR` → `Brazil` → `22000448`
5. `joinedGuildAtBj` 为北京时间、精确到秒的正式入会证据。
6. 若 `joinedGuildAtBj` 缺失，MCN 返回 `formal_join_time_missing` 且 `retryable=false`。
7. 若账号属于其他目标公会，返回 `expected_guild_mismatch`，不得自动改用其他公会。
8. `not_found` 仅在完整、当前有效名册前提下返回；证据不足必须返回 `source_stale` 或 `error`。

## 五、日志关联

BANDEIRA 会以 `X-Request-Id` 作为双方排障唯一关联键。请确认 MCN 的日志或工单查询可按该字段定位，并说明排障时建议提供的最小信息：

```text
X-Request-Id
请求时间
目标公会 ID
HTTP 状态码
结果状态或错误代码
```

请按以上五部分逐项答复，并将每项标记为“已确认 / 需配置 / 需业务指定 / 不支持”。
