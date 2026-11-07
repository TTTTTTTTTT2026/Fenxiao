import type { ConsumerWorkspaceResponse } from './api'

export type EarningsPlatform = NonNullable<ConsumerWorkspaceResponse['selected']>

export function earningsPlatformFromSearch(search: string): EarningsPlatform | null {
  const platform = new URLSearchParams(search).get('app')
  return platform === 'timo' ? 'TIMO' : platform === 'linky' ? 'LINKY' : null
}

export function earningsHref(path: string, platform: EarningsPlatform | null | undefined) {
  if (!platform) return path
  const [url, hash] = path.split('#')
  return `${url}${url.includes('?') ? '&' : '?'}app=${platform.toLowerCase()}${hash ? '#' + hash : ''}`
}

export function resolveEarningsPlatform(workspace: ConsumerWorkspaceResponse, requested: EarningsPlatform | null) {
  return requested ?? workspace.selected ?? workspace.preferred ?? 'TIMO'
}
