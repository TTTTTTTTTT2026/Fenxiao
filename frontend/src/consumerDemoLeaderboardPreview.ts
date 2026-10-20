/** Explicit build-time audience, never controlled by query strings or browser storage. */
export function isInternalLeaderboardPreview(audience: string | undefined) {
  return audience === 'internal-review'
}
