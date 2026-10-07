const PURPOSE_LABELS: Record<string, string> = {
  LOGIN: '登录/注册',
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: '有效中',
  CONSUMED: '已使用',
  EXPIRED: '已过期',
}

export function formatPhoneVerificationPurpose(purpose: string): string {
  return PURPOSE_LABELS[purpose] ?? (purpose ? `其他用途（${purpose}）` : '未记录')
}

export function formatPhoneVerificationStatus(status: string): string {
  return STATUS_LABELS[status] ?? (status ? `未知状态（${status}）` : '未记录')
}
