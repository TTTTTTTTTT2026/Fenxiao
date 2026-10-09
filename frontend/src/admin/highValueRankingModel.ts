export type RankingPeriod = 'day' | 'week' | 'month'

export function isoWeek(date: Date): string {
  const thursday = new Date(date)
  thursday.setUTCDate(thursday.getUTCDate() + 4 - ((thursday.getUTCDay() + 6) % 7))
  const year = thursday.getUTCFullYear()
  const firstThursday = new Date(Date.UTC(year, 0, 4))
  const week = 1 + Math.round((thursday.getTime() - firstThursday.getTime()) / 604800000)
  return `${year}-W${String(week).padStart(2, '0')}`
}

export function utcPeriodRange(period: RankingPeriod, value: string): { start: string; end: string } | null {
  let start: Date
  if (period === 'day' && /^\d{4}-\d{2}-\d{2}$/.test(value)) start = new Date(`${value}T00:00:00.000Z`)
  else if (period === 'month' && /^\d{4}-\d{2}$/.test(value)) start = new Date(`${value}-01T00:00:00.000Z`)
  else if (period === 'week' && /^\d{4}-W\d{2}$/.test(value)) {
    const [year, week] = value.split('-W').map(Number)
    const januaryFourth = new Date(Date.UTC(year, 0, 4))
    start = new Date(januaryFourth)
    start.setUTCDate(januaryFourth.getUTCDate() - ((januaryFourth.getUTCDay() + 6) % 7) + (week - 1) * 7)
    if (isoWeek(start) !== value) return null
  } else return null
  if (Number.isNaN(start.getTime()) || (period === 'day' && start.toISOString().slice(0, 10) !== value)) return null
  const exclusiveEnd = new Date(start)
  if (period === 'day') exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 1)
  if (period === 'week') exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 7)
  if (period === 'month') exclusiveEnd.setUTCMonth(exclusiveEnd.getUTCMonth() + 1)
  return { start: start.toISOString(), end: new Date(exclusiveEnd.getTime() - 1).toISOString() }
}
