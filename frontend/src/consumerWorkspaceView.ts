import type { ConsumerWorkspaceResponse } from './api'

export function resolveConsumerAccountWorkspace(workspace: ConsumerWorkspaceResponse | null) {
  const hasVerifiedApp = workspace?.apps.some((app) => app.verified) ?? false
  const hasEarningsAccess = workspace?.apps.some(canReadAppEarnings) ?? false
  const selected = hasVerifiedApp || hasEarningsAccess ? workspace?.selected ?? null : null
  // A read grant is not a verified binding. Keep both binding entrances for completely unbound users.
  const visibleBindings: Array<'TIMO' | 'LINKY'> = selected && hasVerifiedApp ? [selected] : workspace ? ['LINKY', 'TIMO'] : []
  return { selected, visibleBindings, canSwitch: (hasVerifiedApp || hasEarningsAccess) && selected !== null }
}

export function canReadAppEarnings(app: ConsumerWorkspaceResponse['apps'][number]) {
  return app.earningsReadable ?? app.verified
}

export function canOpenEarningsWorkspace(selected: ConsumerWorkspaceResponse['selected']) {
  return selected !== null
}
