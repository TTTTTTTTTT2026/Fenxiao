# BANDEIRA 生产发布与回滚 Runbook

> 适用于后台、MCN 收入事实、邀请分成、等级和团队能力的生产发布。本文只描述应用发布与只读验收；它**不是**开启奖励、钱包、提现或付款的授权。

## 1. 固定原则

- 发布来源只能是已合并的 `main` 提交；发布记录必须写明提交 SHA、执行人、开始/完成时间和变更范围。
- 生产数据库由后端启动时的 Flyway 迁移升级。不得手工修改已执行的迁移，也不得为回滚删除已执行的迁移版本。
- 每次含数据库迁移的发布，必须先完成 MySQL 备份并验证备份压缩包；应用回滚不等同于数据库回滚。
- 发布和验收不得记录密码、Token、Cookie、签名、真实平台账号、收入事实明细或游标。
- 所有真实资金能力默认关闭。本项目当前允许的是事实同步、影子投影、候选演算和人工核对。

## 2. 发布前检查

1. 在 GitHub 确认目标 PR 已合并、必需检查全部通过，记录 `main` 的提交 SHA。
2. 在发布工作目录切换到该 SHA，并确认没有未提交的业务代码或生产 `.env` 被覆盖。
3. 执行与本次变更匹配的后端测试、前端检查和生产构建；至少保留命令退出状态作为证据。

   ```bash
   mvn -q test
   cd frontend
   npm install
   npm run build
   ```

4. 复核生产 `deploy/.env`。配置文件不进 Git、不在日志或回执中展示值。
5. 每次发布均显式保持下列安全开关：

   ```env
   REWARD_ENGINE_ENABLED=false
   REAL_FINANCE_ENABLED=false
   LIFECYCLE_SHADOW_ONLY=true
   MCN_INCOME_FACTS_ENABLED=false
   MCN_INCOME_FACTS_CONTROLLED_READ_ONLY_ENABLED=false
   APP_DISTRIBUTION_TEAM_OPERATING_REWARD_ENABLED=false
   APP_DISTRIBUTION_MENTOR_CASH_INCENTIVE_ENABLED=false
   ```

   如需进入 MCN 的受控只读窗口，必须有单独书面批准；仅在批准窗口内调整相应的 MCN 读取开关，窗口结束后立即恢复关闭。任何情况下不得因为本 Runbook 开启真实奖励或资金能力；`REAL_FINANCE_ENABLED` 也必须保持 `false`。

## 3. 备份与发布包

历史发布使用“前端构建产物 + 源码发布包 + Docker Compose”方式。每个发布包须与目标提交一一对应，并写入 SHA-256 校验文件。

1. 在服务器运行既有 MySQL 备份任务，或执行 `deploy/ops/fenxiao-mysql-backup.sh`；确认输出含 `backup verified`，并保留备份路径与校验文件路径。
2. 构建前端后，在受控临时目录制作源码发布包；发布包外部命名包含提交短 SHA 与 UTC 时间，附带 SHA-256 校验文件。
3. 上传发布包与校验文件至服务器的全新发布目录，先校验哈希，再解包；不要覆盖当前运行目录后才校验。
4. 将服务器上的受控生产 `.env` 安全地放入新发布目录。不得用示例值覆盖已有生产密钥。

## 4. 服务器发布

在已核验的新发布目录执行：

```bash
cd deploy
docker compose up --build -d
docker compose ps
```

通过 Compose 启动时：

- MySQL 健康后后端才启动；后端启动会执行 Flyway；
- 后端 readiness 通过后前端才接流量；
- 仅允许通过受控环境变量注入生产配置。

若团队采用固定的反向代理入口，应保持 `deploy/ops/bandeira.nginx.conf` 的既有路由策略，不在业务发布中临时改动 Nginx 规则。

## 5. 发布后 Smoke 验收

1. 容器状态均为运行且健康：`docker compose ps`。
2. 后端 readiness：

   ```bash
   curl --fail --silent http://127.0.0.1:8080/actuator/health/readiness
   ```

   预期：`UP`。

3. 前端后台：访问 `/admin`，预期 HTTP `200` 并可以完成管理员登录。
4. 查看后端启动日志，确认本次 Flyway 迁移成功；只记录迁移版本号，不记录连接串或凭据。
5. 在容器环境中复核第 2 节的安全开关为预期值。至少确认 `REWARD_ENGINE_ENABLED=false`、`REAL_FINANCE_ENABLED=false` 和 `LIFECYCLE_SHADOW_ONLY=true`。
6. 本次 V2 规则相关发布额外检查：
   - `V51` 成功执行；
   - 后台“收入影子账本”可读取历史结果；
   - 候选演算仅展示核对信息，不产生奖励、余额、提现或付款；
   - 如存在可核对事实，原始收入、来源公会比例、公司业务收入基数及直邀 `10%`／间邀 `3%` 的展示一致。

## 6. 回滚

1. 停止继续操作，记录失败时间、发布 SHA、容器状态、健康检查结果和脱敏日志摘要。
2. 若问题在应用层，切换至上一已验证发布包，保留同一份受控生产 `.env`，再执行 `docker compose up --build -d`。
3. 再次完成第 5 节的容器、readiness、前端和安全开关检查。
4. 不手工删除 Flyway 迁移或数据表。若迁移本身导致问题，先从已验证备份恢复到隔离环境演练，并通过新的向前修复迁移处理；恢复生产数据库需要单独授权。

## 7. 发布记录模板

```text
发布编号：
目标 main 提交：
关联 PR：
发布执行人 / 复核人：
开始时间 / 完成时间（UTC+8）：
数据库备份与校验文件路径：
Flyway 迁移结果：
readiness：UP / 失败
/admin：HTTP 状态
安全开关复核：奖励关闭 / 生命周期影子模式 / MCN 读取状态
本次业务验收范围与结论：
回滚入口（上一发布包 / 提交）：
异常与处置：
```

## 8. 已知边界

- 当前仓库仅配置 CI 工作流，没有自动部署工作流；服务器上传、发布命令和回滚由具备服务器权限的发布执行人完成。
- 本地历史发布包证明了发布包与 Docker Compose 的交付方式，但没有保留服务器地址、SSH 配置或生产 `.env`；这些信息必须通过受控运维渠道提供，不能写入仓库。
