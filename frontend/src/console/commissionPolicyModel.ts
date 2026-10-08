import type { CommissionPolicyResponse } from '../api'

export function enabledLevels(policy: CommissionPolicyResponse) {
  return policy.levels
    .filter((level) => level.enabled)
    .map((level) => `L${level.rewardLevel} ${level.rewardRate === null ? '—' : `${(level.rewardRate * 100).toFixed(2)}%`} / 冻结 ${level.freezeDays ?? '—'} 天`)
    .join('；') || '—'
}
