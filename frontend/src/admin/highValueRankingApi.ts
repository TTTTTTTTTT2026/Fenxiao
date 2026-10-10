import { request } from '../httpClient'
import type { RankingPeriod } from './highValueRankingModel'

export type RankingMetric = 'SELF_COMMISSION' | 'DIRECT_RAW_DIAMONDS' | 'NEW_INVITEES'
export type HighValueRankingFilters = {
  platformCode: 'LINKY' | 'TIMO'
  guildId?: string
  countryCode: string
  period: RankingPeriod
  periodValue: string
  operatorAdminId?: number
  rankingMetric: RankingMetric
  page: number
  size: number
}

export type HighValueRankingReport = {
  platformCode: 'LINKY' | 'TIMO'
  guildId: string | null
  countryCode: string
  periodStart: string
  periodEndExclusive: string
  rankingMetric: RankingMetric
  operatorAdminId: number | null
  total: number
  page: number
  size: number
  items: Array<{
    userId: number
    nickname: string | null
    selfCommission: number
    directRawDiamonds: number
    newInvitees: number
  }>
}

export function getHighValueRanking(sessionToken: string, filters: HighValueRankingFilters) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') params.set(key, String(value))
  }
  return request<HighValueRankingReport>(`/admin/distribution/high-value-ranking?${params}`, {
    headers: { 'X-Admin-Session': sessionToken },
  })
}
