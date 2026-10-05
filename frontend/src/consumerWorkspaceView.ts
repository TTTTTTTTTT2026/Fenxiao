import type { ConsumerWorkspaceResponse } from './api'

export function resolveConsumerAccountWorkspace(workspace: ConsumerWorkspaceResponse | null) {
  const hasVerifiedApp = workspace?.apps.some((app) => app.verified) ?? false
  const selected = hasVerifiedApp ? workspace?.selected ?? null : null
  const visibleBindings: Array<'TIMO' | 'LINKY'> = selected ? [selected] : workspace ? ['LINKY', 'TIMO'] : []
  return { selected, visibleBindings, canSwitch: hasVerifiedApp && selected !== null }
}

export function canOpenEarningsWorkspace(selected: ConsumerWorkspaceResponse['selected']) {
  return selected !== null
}
