export type StatusTone = 'success' | 'warning' | 'danger' | 'primary' | 'neutral'

const badgeMap: Record<string, { label: string; tone: StatusTone }> = {
  AVAILABLE: { label: '已可用', tone: 'success' },
  PENDING_REVIEW: { label: '待审核', tone: 'primary' },
  PAYMENT_PENDING: { label: '待打款', tone: 'warning' },
  PAYMENT_FAILED: { label: '打款失败', tone: 'danger' },
  PAID_OUT: { label: '已打款', tone: 'success' },
  REVERSED: { label: '已冲正', tone: 'neutral' },
  HANDLED: { label: '已处理', tone: 'success' },
  PROCESSED: { label: '已处理', tone: 'success' },
  SUCCESS: { label: '成功', tone: 'success' },
  NORMAL: { label: '正常', tone: 'success' },
  ACTIVE: { label: '启用', tone: 'success' },
  DISABLED: { label: '停用', tone: 'neutral' },
  MISSING_ON_MCN: { label: 'MCN 已缺失', tone: 'danger' },
  IGNORED: { label: '已忽略', tone: 'neutral' },
  PENDING: { label: '待处理', tone: 'primary' },
  LOCKED: { label: '已锁定', tone: 'warning' },
  RISK_HOLD: { label: '风控冻结', tone: 'warning' },
  FROZEN: { label: '已冻结', tone: 'warning' },
  FAILED: { label: '异常', tone: 'danger' },
  REJECTED: { label: '已拒绝', tone: 'danger' },
  UNLOCKED: { label: '未锁定', tone: 'success' },
}

export function statusPresentation(status: string) {
  return badgeMap[status] ?? { label: status, tone: 'primary' as const }
}
