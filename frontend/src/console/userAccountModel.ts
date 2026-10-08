export function parseAccountUserId(rawUserId: string): number | null {
  const trimmed = rawUserId.trim()
  if (!/^[1-9]\d*$/.test(trimmed)) return null
  const userId = Number(trimmed)
  return Number.isSafeInteger(userId) ? userId : null
}
