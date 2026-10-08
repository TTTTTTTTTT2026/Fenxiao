// The published seven-grade wording is shared by both admin frontends. Server-side qualification remains authoritative.
export const USER_GRADE_CATALOG = [
  { grade: '普通成员', condition: '注册加入，无须购买课程。', responsibility: '了解基础邀请规则；可参与业务并获得符合规则的个人推荐奖励。', referral: '直邀 10% / 间邀 3%', team: '暂不发放' },
  { grade: '新星', condition: '累计直接推荐 3 名有效用户。', responsibility: '获得新星身份标识，可参加免费带人训练与集体复盘。', referral: '直邀 10% / 间邀 3%', team: '暂不发放' },
  { grade: '银牌', condition: '累计直接推荐 10 名有效用户。', responsibility: '保留新星权益；每月接受一次真实案例小组指导。', referral: '直邀 10% / 间邀 3%', team: '暂不发放' },
  { grade: '金牌', condition: '累计直接推荐 30 名有效用户。', responsibility: '自动建立团队、授予团长权限与培养资格；可开始培养银牌成员，并不等同于经营分红资格。', referral: '直邀 10% / 间邀 3%', team: '暂不发放；团队经营奖励全局关闭' },
  { grade: '铂金', condition: '金牌基础上，至少培养 2 名银牌成员，且至少 2 名银牌成员各自通过 30 天试运营验收；达标后由运营确认升级。', responsibility: '承担实际培养、小组经营与验收责任，需经过运营复核。', referral: '直邀 10% / 间邀 3%', team: '暂不发放；团队经营奖励全局关闭' },
  { grade: '钻石', condition: '铂金基础上，实际培养 2 名金牌成员；相关团队连续 2 个完整自然月完成经营验收。', responsibility: '获得多团队经营视图并承担负责人培养支持，需经过运营复核。', referral: '直邀 10% / 间邀 3%', team: '暂不发放；团队经营奖励全局关闭' },
  { grade: '黑金', condition: '钻石基础上，实际培养 2 名钻石成员；负责业务连续 3 个完整自然月完成经营验收。', responsibility: '具备区域经营试点候选资格及更深度的公司协作责任，需经过运营复核。', referral: '直邀 10% / 间邀 3%', team: '暂不发放；团队经营奖励全局关闭' },
] as const
