import type { EffectiveTeamResponse } from './api'

export function effectiveTeamCount(team: Pick<EffectiveTeamResponse, 'total'> | null, failed: boolean): number | null {
  return failed || !team ? null : team.total
}
