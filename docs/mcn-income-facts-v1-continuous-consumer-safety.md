# MCN 收入事实 V1：持续同步运行保障

## 目标与边界

本项只保障从 MCN 获取 Timo、Linky 收入事实时的持续读取安全性：游标连续、定稿门禁、限流退避与后台可观测。

它不计算奖励、不写入钱包、不生成可提现余额，也不改变任何分成规则。生产环境的 `MCN_INCOME_FACTS_ENABLED` 与 `MCN_INCOME_FACTS_CONTROLLED_READ_ONLY_ENABLED` 必须继续保持关闭，直到业务单独书面放行真实消费。

## 消费门禁

1. 只有 MCN 返回 `READY` 且 `sourceWatermark.completeness=FINAL` 的页面，才会进入本地原始账本并推进平台游标。
2. `STALE`、`READY + 非 FINAL`、或 HTTP `429` 都不会推进游标，也不会写入该页事实。
3. 对于 `STALE` / `WAITING_FINALITY`，优先采用 MCN 返回的 `retryAfterSeconds`；缺省时在 15 分钟后再试。
4. 对于 HTTP `429`，优先采用 MCN 的 `Retry-After`；缺省时按 V1 契约在 60 秒后再试。
5. 在 `nextAttemptAt` 之前，调度任务返回 `DEFERRED`，不再请求 MCN，避免无效重试或放大限流。

## 运营查看口径

配置页的“收入受控联调”会展示每个平台的最近快照水位与下次尝试时间。可按下列状态处理：

| 状态 | 含义 | 处理方式 |
| --- | --- | --- |
| `SUCCESS` | 已接受一页 FINAL 收入事实并安全推进游标 | 正常观察 |
| `WAITING_FINALITY` | MCN 已准备数据，但水位尚未 FINAL | 等待下次尝试；不得人工绕过门禁 |
| `STALE` | MCN 指示当前读取窗口尚不可消费 | 等待 MCN 指定或默认退避时间 |
| `THROTTLED` | MCN 返回限流 | 等待下次尝试；不要连续手工点击 |
| `DEFERRED` | 尚未到安全重试时间，本地未发起外部调用 | 无需处理 |
| `FAILED` | 非限流的传输或处理失败 | 查看最近运行错误并按故障流程排查 |

## 开启前检查

1. 确认双方对当天读取窗口、平台、业务日期和最终水位的口径一致。
2. 确认收入事实只读验收完成，且后台同步状态没有 `FAILED`、`STALE` 或 `WAITING_FINALITY`。
3. 先执行受控只读运行与对账，不得把“持续同步开启”理解为“奖励或资金放行”。
4. 任何奖励入账、钱包余额或付款能力均需在后续独立需求与审批中实现和启用。
