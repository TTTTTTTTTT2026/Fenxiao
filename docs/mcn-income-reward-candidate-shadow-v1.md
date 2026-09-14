# MCN 收入奖励候选影子账本 V1

## 目的与边界

本账本用于把已经保存的 MCN 收入事实，按 BANDEIRA 当前已配置的邀请关系与规则，演算成**不可支付的候选结果**。它回答“依现行规则，这条事实理论上会产生哪些二级、三级、四级分佣”，不回答“应向谁付款”。

本模块绝不调用奖励记录、钱包、提现、付款、旧版奖励引擎或收入累计逻辑；任何候选金额都不是余额、可提现额或已发奖励。

导师奖励是独立业务：按已存在的生命周期里程碑和导师规则形成 `incentive_shadow_ledger`，不从 MCN 收入事实按比例推导。因此不会与邀请分佣混算。

## 候选的时间与资格口径

1. 仅处理收入影子投影状态为 `BOUND_FINAL` 的最新修订事实。
2. 来源用户的平台绑定必须在该收入 `occurredAt` 或更早已经核验完成；晚于发生时点的绑定标记为 `BLOCKED_BINDING_NOT_EFFECTIVE`，防止事后认领历史收入。
3. 邀请关系使用 `invitation_relation_version` 在 `occurredAt` 时有效的版本，逐级最多追溯三层。后续人工改关系不会改写候选所依据的历史关系版本。
4. 二级／三级／四级技术层级分别映射 `rewardLevel=1/2/3`；每层仅使用来源用户国家、角色和 `occurredAt` 时唯一有效的 `reward_rule`。默认业务比例可为 10%／2%／0.5%，但生产不会自动补写规则；缺规则必须显式标为 `BLOCKED_NO_RULE`。
5. 候选只保留原始金额单位（如 `TIMO_DIAMOND` / `LINKY_DIAMOND`），不换汇。

## 可审计状态

- `SOURCE_READY`：收入已定稿、已归属，且绑定在收入发生时已生效。
- `CANDIDATE`：对应层级的邀请关系、收款人状态和规则都满足；仅为影子候选。
- `BLOCKED_UNMATCHED` / `BLOCKED_AWAITING_FINALITY` / `BLOCKED_VOIDED`：来源事实本身不具备候选资格。
- `BLOCKED_BINDING_NOT_EFFECTIVE`：绑定发生在收入之后。
- `BLOCKED_SOURCE_INACTIVE` / `BLOCKED_RECIPIENT_INACTIVE`：当前账户状态需要运营处理。
- `BLOCKED_NO_INVITER` / `BLOCKED_NO_RULE`：缺少当时有效邀请人或规则。

## 上线门禁

候选账本通过不等于可发奖。后续仍须由业务、财务确认奖励规则、差异处置、撤销／更正冲正、连续拉取与人工复核流程，并另行建设从候选到奖励记录的受控放行步骤。
