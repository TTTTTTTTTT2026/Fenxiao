import { request } from './httpClient'

export type DemoPeriod = 'DAY' | 'WEEK' | 'MONTH'
export type DemoEntry = {
  rank: number; personaId: string; maskedNickname: string; countryCode: 'ID' | 'BR'
  avatarAssetId: string; amountUsd: string; invitationCount: number
}
export type DemoBoard = { period: DemoPeriod; startDate: string; endDate: string; items: DemoEntry[] }
export type DemoSnapshot = {
  mode: 'DEMO'; currency: 'USD'; asOfDate: string; publishedAt: string; nextUpdateAt: string; stale: boolean; boards: DemoBoard[]
}
const avatars = new Set(['nature-001', 'cartoon-001', 'portrait-001', 'food-001'])
export const demoPeriods: DemoPeriod[] = ['DAY', 'WEEK', 'MONTH']

export function requireDemoSnapshot(value: DemoSnapshot): DemoSnapshot {
  if (!value || value.mode !== 'DEMO' || value.currency !== 'USD' || !/^\d{4}-\d{2}-\d{2}$/.test(value.asOfDate)
      || !Number.isFinite(Date.parse(value.publishedAt)) || !Number.isFinite(Date.parse(value.nextUpdateAt))
      || typeof value.stale !== 'boolean' || !Array.isArray(value.boards) || value.boards.length !== 3
      || demoPeriods.some(period => value.boards.filter(board => board.period === period).length !== 1)) throw new Error('Invalid demo snapshot')
  for (const board of value.boards) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(board.startDate) || board.endDate !== value.asOfDate
        || board.startDate > board.endDate || !Array.isArray(board.items) || board.items.length !== 10
        || new Set(board.items.map(item => item.personaId)).size !== 10) throw new Error('Invalid demo board')
    for (let index = 0; index < board.items.length; index++) {
      const item = board.items[index]
      if (item.rank !== index + 1 || !/^demo-\d+$/.test(item.personaId)
          || !/^.\*{3}.$/u.test(item.maskedNickname) || !['ID','BR'].includes(item.countryCode)
          || !avatars.has(item.avatarAssetId) || !/^\d{1,5}\.\d{2}$/.test(item.amountUsd)
          || !Number.isInteger(item.invitationCount) || item.invitationCount < 0 || item.invitationCount > 155
          || (index > 0 && Number(board.items[index - 1].amountUsd) < Number(item.amountUsd))) throw new Error('Invalid demo entry')
    }
  }
  return value
}

export async function getDemoLeaderboard() {
  return requireDemoSnapshot(await request<DemoSnapshot>('/api/public/demo-leaderboard'))
}
