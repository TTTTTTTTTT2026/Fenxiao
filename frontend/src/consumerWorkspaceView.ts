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

export function shouldShowTimoEarningsGuide(workspace: ConsumerWorkspaceResponse, explicitTimoIntent = false) {
  const app = workspace.apps.find((item) => item.code === 'TIMO')
  if (!app || app.verified || canReadAppEarnings(app)) return false
  return workspace.selected === 'TIMO'
    || (workspace.selected === null && (workspace.preferred === 'TIMO' || explicitTimoIntent))
}

export function canOpenEarningsWorkspace(workspace: ConsumerWorkspaceResponse, explicitTimoIntent = false) {
  return workspace.selected !== null || shouldShowTimoEarningsGuide(workspace, explicitTimoIntent)
}
