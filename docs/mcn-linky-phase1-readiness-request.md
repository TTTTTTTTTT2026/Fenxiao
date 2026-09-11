# BANDEIRA → MCN：Linky P0 权威归属核验对接请求

你现在是 MCN 中台 Linky 外部接口的对接负责人。

BANDEIRA 已完成 Timo V3 的最小化生产只读联调与验收。现启动 **Linky P0：账号绑定时的目标公会归属核验**。本文件请求 MCN 提供接口契约、接入条件与受控联调条件，供双方先完成“可绑定 / 不可绑定 / 暂不能判断”的安全闭环。

> 更新说明（2026-09-11）：BANDEIRA 已完成站内 Linky 邀请链归属改造。本版明确区分“MCN 提供的实际平台公会事实”与“BANDEIRA 决定的邀请链目标公会”；MCN 只需按每次请求给出的 `expectedGuildId` 返回权威事实，**不需要也不得推导邀请码关系、上级关系或奖励归属**。

请勿在回复正文、普通邮件、Git、工单、截图、应用日志或示例请求中提供生产 Secret、Token、Cookie、签名原文、真实手机号、邀请码、WhatsApp 或未经授权的平台账号资料。凭据必须独立、安全交付。

## 一、本期目标与明确边界

### 1.1 本期要完成的能力

当 BANDEIRA 用户提交 Linky 账号时，BANDEIRA 向 MCN 发起只读查询，由 MCN 提供该账号在当次快照中的目标公会归属事实。BANDEIRA 根据事实完成自身业务判定、保存审计记录并向用户展示结果。

Linky 平台主标识定义如下：

```text
subjectId = sid = BANDEIRA 现有 linky_account
格式：8 位纯数字
```

请确认 MCN 中 Linky 的主标识是否也是该 `sid`，且不存在需要 BANDEIRA 额外使用昵称、手机号、Linky 内部 user_id 或其他别名进行匹配的情况。

### 1.2 BANDEIRA 本期业务规则

#### 两类数据必须严格分离

| 数据 | 责任方 | 含义与使用方式 |
|---|---|---|
| 实际平台公会事实 | MCN | 某个 Linky SID 在本次权威快照中实际所属的公会、快照时间与证据状态。MCN 不应从 BANDEIRA 接收的邀请码、上级或运营配置推导它。 |
| 邀请链目标公会 `expectedGuildId` | BANDEIRA | BANDEIRA 在每次绑定提交时自行计算，并随请求传给 MCN。它只是“本次需要核验的目标”，不是 MCN 要保存或反向推导的用户归属。 |

1. BANDEIRA 会根据邀请码关系解析 `expectedGuildId`。优先级为：该直接邀请人的有效人工覆盖归属 → 历史人工专属配置（过渡兼容）→ 该邀请人已核验的实际 Linky 公会 → 沿上级邀请链继续继承 → 系统默认公会。
2. 用户完成本站 Linky 核验后，BANDEIRA 会把 MCN 返回的实际公会写为该用户未来邀请下级的默认邀请链归属；若运营因邀请人换公会作了人工覆盖，人工覆盖优先，且不会被后续核验静默改写。
3. 用户尚未完成 Linky 核验时仍可注册和邀请。此时 BANDEIRA 可使用“继承上级”或“系统默认”的兜底目标发起核验，并在本站记录来源为 `FALLBACK_INHERITED` 或 `SYSTEM_DEFAULT`；**兜底只决定本次要查询的目标，不构成通过依据**。
4. 因此，只有 MCN 能以完整、新鲜且无矛盾的事实确认 SID 当前属于请求内的 `expectedGuildId` 时，BANDEIRA 才允许完成绑定。当前属于其他公会、未加入目标公会或未命中目标范围时，BANDEIRA 不允许完成绑定；可向用户展示应加入的公会邀请码。
5. 数据不完整、快照过期、来源异常、限流或无法形成权威结论时，BANDEIRA 必须保持“核验中”或提示稍后重试，**不得因邀请链兜底而自动通过、不得自动发奖**。
6. 本期不要求 Linky 的“入会时间与绑定提交时间相差不超过 24 小时”规则；该严格 24 小时规则目前仅适用于 Timo。若 Linky 后续需要同类规则，将由 BANDEIRA 另行提出。
7. 同一个 Linky SID 在 BANDEIRA 只能归属一个用户；发现既有绑定冲突时由 BANDEIRA 拒绝或转人工，MCN 不需要判断奖励归属。

### 1.3 不属于本期范围

- Linky 收益、流水、订单、结算、退款、撤销或收入快照；
- CRM 写入、用户创建、自动绑定、自动更改邀请码关系；
- 真实奖励计算、提现、支付或任何资金动作；
- 解析、保存或同步邀请码、邀请人、邀请链归属、人工覆盖、默认公会与奖励归属；
- 直接调用 Linky 官方平台或交付其官方凭据；
- 将 Timo 凭据、接口或数据与 Linky 共用。

## 二、已确认的最小只读接口契约

以下内容已由 MCN 的《Linky P0 生产接入规范》确认，并作为 BANDEIRA 的实现基线。

请求语义：

```text
按 Linky SID 批量查询“是否处于指定目标公会”的当前权威事实。
```

建议请求字段：

```json
{
  "platform": "LINKY",
  "subjects": [
    {
      "subjectId": "12345678",
      "expectedGuildId": "39694876"
    }
  ]
}
```

其中：

- 正式 Base URL：`https://mcnserver.timetrade.club`；路径：`POST /api/external/linky/v1/guild-membership/batch-query`；`apiVersion` 固定为 `"1"`。
- `subjectId` 和 `expectedGuildId` 为必填，均为 8 位纯数字；请求最多 10 个 subject。`expectedCountry` 与 `lookupMode` **不得发送**。
- `expectedGuildId` 是 BANDEIRA 在**本次请求时**计算出的业务目标。MCN 必须直接按该值查询或比对当前事实；不要缓存它为 SID 的固有属性，也不要尝试以历史请求、用户关系或国家替换该值。
- `FALLBACK_INHERITED`、`SYSTEM_DEFAULT`、`VERIFIED_BINDING`、`ADMIN_OVERRIDE` 等归属来源仅为 BANDEIRA 站内审计字段，**不要求 MCN 接收、保存或在响应中推导**。
- MCN 服务端固定使用 `LIVE_REQUIRED` 口径；BANDEIRA 不传国家或查询模式。
- BANDEIRA 每次业务核验会使用新的 Request ID、Idempotency Key、Timestamp、Nonce 与 Signature。

每个 subject 的响应至少包含：

```json
{
  "subjectId": "12345678",
  "status": "found | not_found | error",
  "membershipStatus": "IN_EXPECTED_GUILD | OTHER_GUILD | NOT_IN_TARGET_SCOPE | UNKNOWN",
  "observedGuildScope": {
    "guildId": "...",
    "guildName": "..."
  },
  "snapshotAt": "...",
  "sourceGeneration": "...",
  "checksum": "...",
  "error": {
    "code": "...",
    "retryable": false
  }
}
```

说明：当 `membershipStatus = IN_EXPECTED_GUILD` 时，`observedGuildScope.guildId` 必须返回实际命中的公会 ID，且应等于请求的 `expectedGuildId`；同时 `snapshotAt`、`sourceGeneration` 和 `checksum` 三项证据必须非空。BANDEIRA 只在这些条件全部满足时保存实际平台事实。若 SID 不在目标公会，MCN 会最小化返回其他公会资料，BANDEIRA 不会尝试推断或放行。

数据最小化要求：

- 当 SID 不在期望公会时，若返回其他公会信息会泄露不必要事实，请 MCN 说明是否只返回 `OTHER_GUILD` 而不返回其他公会名称/ID。
- `not_found` 只能在目标查询范围完整且快照新鲜时返回；证据不足必须以 `membershipStatus = UNKNOWN` 或可重试 `error` 返回。
- 若同一 SID 同时出现在多个公会或来源互相矛盾，必须返回不可自动通过的非重试错误码，例如 `subject_multiple_guilds`。
- 请定义 `snapshotAt` 的时区、精度、最大可接受陈旧时间，以及“完整名册”的判定依据。

## 三、认证、签名、限流与审计

请逐项确认：

1. 正式 HTTPS Base URL、接口路径、最低 TLS 要求与是否需要 IP 白名单。
2. BANDEIRA 专属的 **Linky 独立 Credential ID**、最小只读 Scope（建议 `linky.guild_membership.read`）、Secret 安全交付方式、轮换与吊销流程。
3. 是否采用与 Timo V3 相同的 HMAC-SHA256 签名方案；若不同，请提供不含生产密钥和真实资料的完整验收向量。
4. 客户端连接超时、请求超时、批量上限、每分钟限流、429 / 503 建议退避，以及 MCN 服务端最长等待时间。
5. 是否支持 `Credential ID + X-Request-Id` 查询独立审计；请说明双方排障所需的最小脱敏字段。
6. 响应的 API 版本字段与未知状态处理要求。BANDEIRA 将对未知版本、未知状态或缺少必要证据 fail-closed。

## 四、受控生产只读联调

在专属凭据配置完成后，请提供或协调下列受控样本；不得在普通回复中粘贴未经授权的真实 SID。

| 用例 | MCN 应确认的事实 | BANDEIRA 预期处理 |
|---|---|---|
| `found` | 8 位 SID 当前在指定目标公会；快照完整、新鲜，并返回实际命中的公会 ID | 绑定核验通过；BANDEIRA 写入实际公会事实与后续邀请链默认归属 |
| `other_guild` 或等价事实 | SID 已在非期望公会，或至少能确定未在期望公会 | 拒绝绑定，并展示应加入目标公会的引导 |
| `not_found` | SID 在完整、新鲜的目标范围内未命中 | 拒绝绑定或按明确规则提示未加入目标公会 |
| `membershipStatus = UNKNOWN` / 可重试 `error` | 不要求在生产制造故障；可由契约/Mock 覆盖 | 保持核验中，按退避重试 |
| 不可重试错误 | 例如多公会冲突、主体格式不合规或事实矛盾 | 不自动通过，转人工或明确拒绝 |

每个真实联调请求都将由 BANDEIRA 记录：请求时间、HTTP 状态、请求中的 `expectedGuildId`、MCN 原始小写 `status`、错误码、耗时、快照信息与 `X-Request-Id`。BANDEIRA 不会回传 Secret、完整 Signature、Cookie、Token、手机号、邀请码或未经脱敏的请求 Body。

## 五、旧 Linky 流程迁移边界

BANDEIRA 当前存在基于旧 OAuth/probe 的 Linky 公会探测与基于旧 webhook 的收益入口。MCN Linky P0 上线后，生产绑定核验将以 MCN 事实为唯一权威来源；旧 probe 不应再与 MCN 并行作出最终通过决定。

请说明 MCN 是否支持后续对已绑定 SID 的受控批量复核能力（仅需说明能力、批量上限、游标/分页、快照和限流；本期不要求立即执行历史数据迁移）。

## 六、请按以下格式答复

请对每项标注：`已确认 / 需配置 / 需 BANDEIRA 业务指定 / 不支持`。

```text
【MCN Linky P0 对接答复】
1. 主标识 sid 与 8 位格式：
2. 正式 Base URL / 接口路径 / API 版本：
3. 请求与响应字段契约：
4. 目标公会、国家与名册完整性口径：
5. 状态、错误码与 retryable 口径，以及 `IN_EXPECTED_GUILD` 时实际公会字段的返回保证：
6. Credential、Scope、签名与安全交付：
7. 超时、限流、重试与审计查询：
8. 受控 found / other_guild / not_found 联调样本：
9. 已绑定 SID 的后续批量复核能力：
10. 需要 BANDEIRA 确认的业务决定：
```

本期仅请求 Linky 绑定归属核验。关于 Timo / Linky 收益事实、订单、结算、更正、撤销和影子账本的数据接口，将在 P1 以独立协议另行对接。
