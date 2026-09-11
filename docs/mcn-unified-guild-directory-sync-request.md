# BANDEIRA → MCN：Linky / Timo 统一公会目录同步接口请求

你现在是 MCN 中台外部接口的负责人。BANDEIRA 已建立本地的“平台公会目录同步副本”，用于运营查询、邀请链目标公会映射和异常发现；**MCN 仍是公会目录与公会事实的唯一权威来源**。

请只回复接口契约、可用性与联调安排。不要在正文、Git、截图、日志样本或普通消息中提供生产 Secret、Token、Cookie、签名原文、真实手机号、真实平台账号或其他敏感资料。

## 一、业务边界

1. MCN 负责返回 Linky 与 Timo 的权威公会目录：稳定公会 ID、名称、状态、权威更新时间与快照版本。
2. BANDEIRA 只保存 MCN 的同步副本，并维护自身业务映射，例如“某邀请人未来下级应使用哪个目标公会”。该业务映射不要求 MCN 保存或推导。
3. BANDEIRA 在用户绑定时仍会使用既有的实时账号归属核验接口；目录同步不能代替账号归属核验。
4. 若 BANDEIRA 已存在某公会但一次 **完整且成功** 的 MCN 快照未包含该公会，BANDEIRA 会将其标记为 `MISSING_ON_MCN` 异常，保留历史和审计，不会自动删除。
5. 分页中断、超时、限流、快照版本变化或任何不完整响应，都不得触发“缺失”判断。

## 二、建议接口：按平台获取一致性分页快照

建议提供一个只读接口，每次调用只返回一个平台的目录；BANDEIRA 会分别同步 `LINKY` 与 `TIMO`，以隔离失败和便于排障。

```text
GET /api/external/guild-directory/v1/snapshots/{platform}
```

其中 `{platform}` 仅允许 `LINKY` 或 `TIMO`。

建议请求参数：

```text
pageSize=100                 # MCN 指定并明确最大值
cursor=opaque-next-cursor    # 首次不传；后续原样回传
snapshotId=...               # 首次不传；后续分页固定回传，保证读取同一快照
```

建议响应示例（字段名称可调整，但请保持语义完整）：

```json
{
  "ok": true,
  "apiVersion": "1",
  "requestId": "mcn-request-id",
  "platform": "LINKY",
  "snapshotId": "opaque-stable-snapshot-id",
  "snapshotVersion": "2026-09-11T09:00:00Z-or-monotonic-version",
  "snapshotAt": "2026-09-11T09:00:00Z",
  "nextCursor": "opaque-cursor-or-null",
  "isLastPage": false,
  "items": [
    {
      "guildId": "39694876",
      "guildName": "Example Guild",
      "guildStatus": "ACTIVE",
      "officialUpdatedAt": "2026-09-11T08:55:00Z",
      "sourceVersion": "optional-item-version",
      "joinInstruction": "optional invitation code or approved join instruction"
    }
  ]
}
```

## 三、必须确认的目录语义

请逐项明确：

1. `guildId` 是否为平台内稳定且不可复用的主键；同一 ID 是否可能在 Linky 与 Timo 分别存在（BANDEIRA 会以 `platform + guildId` 联合唯一）。
2. Linky 与 Timo 各自合法的 ID 格式、长度与字符集。
3. `guildStatus` 的完整枚举及含义，至少区分可用、停用、已关闭、受限或未知；请确认目录是否包含历史停用公会。
4. 公会改名、合并、拆分、迁移、关闭和 ID 失效时的权威表示方式。请勿通过静默复用旧 ID 表示新公会。
5. `snapshotId` 在多页拉取期间的有效期、并发限制与一致性保证。BANDEIRA 需要保证所有页面属于同一逻辑快照。
6. `snapshotVersion` 是否单调递增或可比较；`snapshotAt`、`officialUpdatedAt` 的时区与精度。
7. `joinInstruction` 的权威归属：若 MCN 不维护邀请码/入会链接，请明确返回 `null`，BANDEIRA 会把该字段视为独立业务内容，不能臆造。
8. 删除语义：公会不再出现在完整目录中是否等价于“权威不存在”；如不是，请提供显式删除/撤销状态。

## 四、认证、频率与安全

请确认是否可复用现有 MCN HMAC-SHA256 鉴权规范。建议使用单独的 Credential ID 与最小只读 Scope：

```text
guild_directory.read
```

还请提供：

1. 生产 Base URL、路径、TLS 最低要求、IP 白名单需求；
2. 请求 ID、幂等键、时间戳、nonce、签名串与 header 规则；
3. 分页最大 `pageSize`、每分钟限流、连接/响应超时、429 与 5xx 退避建议；
4. 快照过期、cursor 非法、快照版本变动、重复项、跨页重复项的错误码；
5. 可供双方关联排障的最小字段，如 `Credential ID + X-Request-Id + snapshotId`。

## 五、BANDEIRA 的同步和异常处理承诺

1. BANDEIRA 计划按小时同步 Linky 与 Timo；支持后续按 MCN 限流改为更低频率，并提供人工触发入口。
2. 只有所有分页成功、平台一致、快照 ID 一致且 `isLastPage=true` 时，BANDEIRA 才提交本次对账。
3. 成功时，返回项会更新为 `NORMAL`；此前本地存在但本次完整快照未出现的项才标记 `MISSING_ON_MCN`。
4. 失败或不完整时，BANDEIRA 仅记录失败批次与告警，不改变原目录状态、不删除公会、不修改邀请链映射。
5. BANDEIRA 的邀请链映射将只选择 `NORMAL + ACTIVE` 的同步目录项；已变为异常或停用的映射保留历史并阻止新增使用。

## 六、最小生产联调用例

请为 Linky、Timo 各确认可验证的脱敏样本或可控快照，并说明预期：

1. 首次完整快照，至少有一个 `ACTIVE` 公会；
2. 公会改名或权威更新时间变化；
3. 公会状态从 `ACTIVE` 变为不可用；
4. 某个历史公会在完整快照中消失；
5. 两页及以上的稳定分页快照；
6. 分页中途超时/限流/快照过期，确认 BANDEIRA 不应将其判为缺失；
7. 同一 `guildId` 在 Linky、Timo 的隔离处理（如该情况合法）；
8. HMAC 正确、签名错误、Credential 无权限、参数格式错误的响应格式。

## 七、请按此模板回复

```text
1. 接口路径、方法、认证与独立 Credential Scope：
2. Linky / Timo 的 ID 格式与状态枚举：
3. 分页、snapshotId、一致性、过期与限流规则：
4. 请求/响应 JSON 契约与错误码：
5. joinInstruction / 邀请码字段的权威归属：
6. 删除、合并、迁移、改名的目录语义：
7. 生产联调窗口、脱敏样本与排障关联方式：
8. 需要 BANDEIRA 进一步确认的事项：
```
