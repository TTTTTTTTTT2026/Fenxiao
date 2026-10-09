import { request } from '../httpClient'

export type PlatformIntegrationResponse = {
  platformCode: string
  displayName: string
  primaryAccountIdentifier: string
  accountIdentifierNote: string
  mcnIntegrationStatus: string
  revenueIngestionMode: string
  rewardMode: string
  enabled: boolean
  targetGuilds: Array<{ countryCode: string; officialGuildId: string; officialGuildSid: string | null; guildName: string; enabled: boolean; authoritative: boolean; directoryStatus: string; guildStatus: string; operatingShareRate: number | null; pendingOperatingShareRate: number | null; pendingShareVersion: number | null }>
}

export type PlatformVerificationRuntimeResponse = {
  source: 'MOCK' | 'MCN' | 'DISABLED' | string
  mockManagementEnabled: boolean
  explanation: string
}

export function getAdminPlatformIntegrations(adminSessionToken: string) {
  return request<PlatformIntegrationResponse[]>('/admin/platform-integrations', {
    headers: { 'X-Admin-Session': adminSessionToken },
  })
}

export function getAdminPlatformVerificationRuntime(adminSessionToken: string) {
  return request<PlatformVerificationRuntimeResponse>('/admin/platform-verification', {
    headers: { 'X-Admin-Session': adminSessionToken },
  })
}
