# BANDEIRA → MCN：统一公会目录 V1 生产发布与凭据交付请求

你现在是 MCN 中台统一公会目录 V1 的发布负责人。BANDEIRA 已完成对应客户端与安全同步逻辑，相关代码正在 PR 审查中；在 MCN 完成受控生产发布并交付目录专属凭据前，BANDEIRA 不会开启真实调用。

请不要在回复正文、Git、工单、截图、日志样本或普通消息中发送任何生产 Secret、Token、Cookie、签名原文、真实用户资料或平台账号资料。

## 一、请 MCN 先完成的生产动作

1. 按 MCN 自身发布治理流程，将统一公会目录 V1 发布到生产环境：

```text
GET /api/external/guild-directory/v1/snapshots/{platform}
platform = LINKY | TIMO
```

2. 创建 BANDEIRA 专属、最小只读的 Credential：

```text
Scope: guild_directory.read
```

不得复用既有 Timo V3 或 Linky 核验 Credential、Secret、限流配额或审计链路。

3. 如需 IP 白名单，请先说明所需格式、审批方式和生效时间；BANDEIRA 将通过受控渠道提供生产出口信息。

4. 请确认生产接口具备此前约定的完整性保护：`snapshotId`、`snapshotVersion`、`snapshotChecksum`、稳定分页、15 分钟快照有效期，以及错误时不返回“成功但空目录”的快照。

## 二、请安全交付的信息

请在受权加密渠道、密钥管理系统或双方认可的安全方式交付，不要写入本回复：

```text
- Credential ID
- HMAC Secret
- 生产 Base URL（如与已确认域名不同）
- Scope 与凭据状态
- 是否启用 IP 白名单
- 凭据轮换、吊销与紧急联系人流程
```

## 三、发布后请进行非破坏性 Smoke

请使用 MCN 内部受控方式验证，不修改真实公会状态、不创建测试公会、不修改生产业务数据：

1. Linky：`pageSize=100` 的首个完整快照可读；
2. Timo：`pageSize=100` 的首个完整快照可读；
3. Linky 与 Timo 分别以 `pageSize=1` 验证稳定多页；
4. 验证同一快照下分页的 `snapshotId`、`snapshotVersion`、`snapshotChecksum` 不变；
5. 验证错误签名、无 Scope、cursor/snapshot 不匹配、过期快照的正确错误码；
6. 验证 Linky 的 `ACTIVE` / `DISABLED` 均可按目录返回；
7. 确认 `directoryScope=MCN_MANAGED_GUILDS`、`joinInstruction=null`、`officialUpdatedAt=null` 属于当前 V1 的既定口径。

## 四、请按此模板回复发布回执

```text
1. 生产发布状态：已发布 / 未发布
2. 发布版本或发布回执 ID：
3. Endpoint 与 apiVersion：
4. Credential 是否已通过安全渠道交付：是 / 否（不要粘贴 Secret）
5. Scope、限流、快照有效期与 IP 白名单状态：
6. Linky Smoke：通过 / 失败；目录条数与 ACTIVE / DISABLED 统计：
7. Timo Smoke：通过 / 失败；目录条数与 ACTIVE / DISABLED 统计：
8. pageSize=1 稳定分页 Smoke：通过 / 失败：
9. 最早可供 BANDEIRA 最小只读联调的北京时间窗口：
10. 排障联系人与最小关联字段要求：
11. 仍阻塞的事项：
```

## 五、BANDEIRA 收到回执后的动作

1. 合并并部署统一目录同步能力；
2. 在生产密钥管理中配置独立目录 Credential；
3. 保持开关关闭，先用 `pageSize=1` 完成 Linky、Timo 最小只读联调；
4. 仅在整套分页快照成功且一致时提交目录；
5. 联调通过后开启按小时同步，并把 `NORMAL + ACTIVE` 公会开放给邀请链目标映射使用。
