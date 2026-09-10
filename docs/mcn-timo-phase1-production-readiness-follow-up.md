# BANDEIRA → MCN：Timo 一期生产就绪整改与联调交付请求

你现在是 MCN 中台 Timo 外部接口的对接负责人。

BANDEIRA 已完成 Timo 一期的离线接入基础建设：HMAC 签名、请求/响应 DTO、四态结果处理、国家与目标公会映射、核验审计、重试机制与本地 Mock 测试均已准备完成。

当前 BANDEIRA 不保存或要求提供任何生产 Secret，也没有启用对 MCN 生产接口的调用。请勿在回复正文中提供 Secret、Token、Cookie、手机号或其他敏感用户资料。

## 一、BANDEIRA 已确认的业务边界

本期仅做 Timo 账号—目标公会归属核验，不包含收益读取、CRM 写入、代办绑定、真实发奖、Linky 对接或平台官方凭据。

BANDEIRA 自行执行以下时间窗口规则，MCN 只提供可信事实证据：

```text
ABS(DATE(joinedGuildAtBj, Asia/Shanghai)
  - DATE(bindingSubmittedAt, Asia/Shanghai)) <= 1 个自然日
```

因此，MCN 不需要替 BANDEIRA 判断通过、拒绝或奖励资格；但 `joinedGuildAtBj` 必须是可信的 Timo 官方正式入会时间。

## 二、请完成并确认的生产阻断项

### 1. BANDEIRA 独立多凭据能力

请实现并完成自测：

- BANDEIRA 独立的 `Credential ID`；
- 仅授予 `timo.joined_guild_at.read` Scope；
- 按 Credential 独立限流、审计与吊销；
- 不影响其他调用方现有 Credential；
- 支持新旧 Secret 短期并行的安全轮换；
- Secret 不出现在普通日志、接口响应、代码库或普通文档中。

完成后，请只说明安全交付方式、Credential ID 的交付渠道、轮换流程和启用窗口；不要在回复中发送生产 Secret。

### 2. `found` 的当前成员语义

请确保 `found` 只在以下条件全部成立时返回：

- 账号属于请求指定的目标公会；
- 证据来自当前、新鲜、完整的目标公会名册或完整实时查询；
- 历史同步记录不会因为未关闭而被误判为当前成员；
- `guildScope.guildId` 与请求的 `expectedGuildId` 一致。

不满足以上条件时：

- 证据过期、刷新失败、分页不完整、限流或无法确认完整性：返回 `source_stale` 或可重试 `error`；
- 账号不在完整且当前有效名册：返回 `not_found`；
- 多公会冲突、目标公会不一致等明确异常：返回不可重试 `error`。

### 3. `joinedGuildAtBj` 的正式来源治理

请确保：

- `joinedGuildAtBj` 只来自 Timo 官方名册 `joinTime`，并按 `Asia/Shanghai` 返回，精确到秒；
- 不再将历史 `created_at` 回填值作为正式入会时间返回；
- 无法取得或确认官方 `joinTime` 时，返回：

```json
{
  "status": "error",
  "joinedGuildAtBj": null,
  "error": {
    "code": "formal_join_time_missing",
    "retryable": false
  }
}
```

## 三、完成后的技术验收材料

请在上述三项完成后，提供以下非敏感信息：

1. 已部署的接口版本、部署时间与变更摘要。
2. 自动化回归结果，至少覆盖：
   - `found`：当前完整名册、目标公会匹配、存在官方 `joinTime`；
   - `not_found`：完整当前名册确认未命中；
   - `source_stale`：证据不新鲜或刷新不可用；
   - `formal_join_time_missing`；
   - `expected_guild_mismatch`；
   - `subject_multiple_guilds`；
   - 多 Credential 隔离、Scope 限制、吊销和轮换。
3. 当前正式接口地址、TLS 证书状态、是否实施 IP 白名单及配置流程。
4. 用于联调的主备联系人、北京时间联调窗口和 P1 故障升级渠道。
5. Request ID 查询审计的操作方式。

## 四、生产只读联调安排

在 MCN 完成整改、BANDEIRA 收到专属凭据并由双方确认联调窗口后，请准备：

1. 一个经授权的 `found` 样本，仅提供：
   - 12 位 Timo ID；
   - `expectedGuildId`；
   - `expectedCountry`；
   - `joinedGuildAtBj`；
   - 预期结果。
2. 一个在当次完整名册中确认的 `not_found` 测试值。
3. 不可重试与可重试异常继续以 BANDEIRA 本地 Mock、HMAC 验收向量和契约测试验收；不要通过破坏生产同步或服务来制造异常。

BANDEIRA 会使用 `X-Request-Id` 作为双方唯一排障关联键，并仅在生产凭据安全配置完成后开启只读调用。

请按以下格式回复每一项：

```text
项目：
状态：已完成 / 开发中 / 未开始 / 不支持
部署或预计完成时间：
验收证据：
对 BANDEIRA 的下一步要求：
```
