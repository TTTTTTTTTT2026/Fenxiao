import { request } from '../httpClient'

export type PointCurrencyRate = {
  id: number; version: number; currencyPerPoint: string | null; enabled: boolean
  status: 'ACTIVE' | 'DISABLED' | 'SCHEDULED' | 'SUPERSEDED' | 'CANCELLED'
  effectiveAt: string; createdBy: number; createdAt: string
}
export type PointCurrencySetting = {
  country: { countryCode: string; countryName: string; currencyCode: string; fractionDigits: number }
  latestVersion: number; current: PointCurrencyRate | null; scheduled: PointCurrencyRate | null
}
export type PointCurrencyDashboard = { referenceOnly: boolean; generatedAt: string; settings: PointCurrencySetting[] }
export type PointCurrencyHistory = { items: PointCurrencyRate[]; nextBeforeVersion: number | null }
export type PointCurrencyQuote = {
  referenceOnly: boolean; status: 'CONFIGURED' | 'DISABLED' | 'NOT_CONFIGURED' | 'UNSUPPORTED_COUNTRY'
  countryCode: string | null; currencyCode: string | null; points: string
  currencyPerPoint: string | null; amount: string | null; rateVersionId: number | null
  effectiveAt: string | null; evaluatedAt: string
}
const base = '/admin/finance/point-currency-rates'
const headers = (session: string) => ({ 'X-Admin-Session': session })
export const getPointCurrencyRates = (session: string, signal?: AbortSignal) => request<PointCurrencyDashboard>(base, { headers: headers(session), signal })
export const savePointCurrencyRate = (session: string, country: string, value: { enabled: boolean; currencyPerPoint: string | null; effectiveAt: string | null; expectedVersion: number }) =>
  request<PointCurrencySetting>(`${base}/${encodeURIComponent(country)}`, { method: 'PUT', headers: headers(session), body: JSON.stringify(value) })
export const getPointCurrencyHistory = (session: string, country: string, beforeVersion?: number | null) =>
  request<PointCurrencyHistory>(`${base}/${encodeURIComponent(country)}/history${beforeVersion ? `?beforeVersion=${beforeVersion}` : ''}`, { headers: headers(session) })
export const previewPointCurrency = (session: string, value: { points: string; countryCode?: string; userId?: string }) =>
  request<PointCurrencyQuote>(`${base}/preview`, { method: 'POST', headers: headers(session), body: JSON.stringify(value) })
