import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { getAdminTimoGuildCountries, saveAdminTimoGuildCountries, type PlatformIntegrationResponse, type TimoGuildCountryAccessResponse } from '../api'
import LegacyPlatformGuildTable from './LegacyPlatformGuildTable'
import { TimoGuildCountryFields } from './LegacyTimoGuildCountriesDialog'
import ConfirmDialog from './LegacyConfirmDialog'

const platform: PlatformIntegrationResponse = {
  platformCode: 'TIMO', displayName: 'Timo', primaryAccountIdentifier: 'timo_id', accountIdentifierNote: '',
  mcnIntegrationStatus: 'MCN', revenueIngestionMode: 'DAILY_SNAPSHOT', rewardMode: 'SHADOW_ONLY', enabled: true,
  targetGuilds: [{ countryCode: 'MX', officialGuildId: '22000408', officialGuildSid: null, guildName: 'Test Latam guild', enabled: true,
    authoritative: true, directoryStatus: 'NORMAL', guildStatus: 'ACTIVE', operatingShareRate: 0.5, pendingOperatingShareRate: null,
    pendingShareVersion: null, acceptedCountryCodes: ['MX', 'VE', 'CO', 'CL', 'PE'] }],
}
const value: TimoGuildCountryAccessResponse = {
  guildId: '22000408', guildName: 'Test Latam guild', mcnCountry: 'Mexico', managed: true, version: 2,
  countryCodes: ['MX', 'VE', 'CO', 'CL', 'PE'],
  countryOptions: [{ code: 'MX', name: '墨西哥' }, { code: 'CO', name: '哥伦比亚' }, { code: 'VE', name: '委内瑞拉' }, { code: 'CL', name: '智利' }, { code: 'PE', name: '秘鲁' }],
}
const table = (source = platform, editCountries = true) => renderToStaticMarkup(<LegacyPlatformGuildTable platform={source}
  loading={false} canEditShare={true} canEditCountries={editCountries} onEditCountries={() => {}} onEditShare={() => {}} />)

afterEach(() => vi.unstubAllGlobals())
describe('legacy Timo guild country administration', () => {
  it('separates MCN country, accepted user countries and the two independent operations', () => {
    const html = table()
    expect(html).toContain('公会所属国家（MCN）')
    expect(html).toContain('可接纳用户国家')
    expect(html).toContain('墨西哥、委内瑞拉、哥伦比亚、智利、秘鲁')
    expect(html).toContain('编辑分成')
    expect(html).toContain('配置接纳国家')
    expect(html).toContain('50.00%')
  })
  it('does not expose the editor to read-only users, Linky, inactive or non-authoritative guilds', () => {
    expect(table(platform, false)).not.toContain('配置接纳国家')
    expect(table({ ...platform, platformCode: 'LINKY' })).not.toContain('配置接纳国家')
    for (const changes of [{ directoryStatus: 'MISSING_ON_MCN' }, { guildStatus: 'DISABLED' }, { authoritative: false }]) {
      expect(table({ ...platform, targetGuilds: [{ ...platform.targetGuilds[0], ...changes }] })).not.toContain('配置接纳国家')
    }
  })
  it('does not confuse an explicitly empty acceptance list with missing data', () => {
    expect(table({ ...platform, targetGuilds: [{ ...platform.targetGuilds[0], acceptedCountryCodes: [] }] })).toContain('不接纳新绑定')
  })
  it('keeps MCN identity read-only and only edits country checkboxes', () => {
    const html = renderToStaticMarkup(<TimoGuildCountryFields value={value} selected={['MX', 'CO']} disabled={false} onChange={() => {}} />)
    expect(html).toContain('Mexico')
    expect(html).toContain('22000408')
    expect(html.match(/type="checkbox"/g)).toHaveLength(5)
    expect(html.match(/checked=""/g)).toHaveLength(2)
    expect(html).not.toContain('type="text"')
    expect(html).toContain('不修改MCN公会国家')
    expect(html).toContain('不等于已配置该国分佣规则')
  })
  it('retains accessible legacy modal semantics and disables submission when unavailable', () => {
    const html = renderToStaticMarkup(<ConfirmDialog title="配置接纳国家" tone="primary" confirmText="保存" confirmDisabled onConfirm={() => {}} onCancel={() => {}}>内容</ConfirmDialog>)
    expect(html).toContain('role="dialog"')
    expect(html).toContain('aria-modal="true"')
    expect(html).toContain('disabled="">保存')
  })
  it('reads configuration and saves only the selection and expected version with a real session header', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => value })
    vi.stubGlobal('fetch', fetch)
    await getAdminTimoGuildCountries('test-session', '22000408')
    await saveAdminTimoGuildCountries('test-session', '22000408', 2, ['MX', 'CO'])
    expect(fetch.mock.calls[0][0]).toBe('/admin/platform-integrations/TIMO/guilds/22000408/accepted-countries')
    expect(fetch.mock.calls[1][1]).toEqual(expect.objectContaining({ method: 'PUT',
      headers: expect.objectContaining({ 'X-Admin-Session': 'test-session' }), body: JSON.stringify({ expectedVersion: 2, countryCodes: ['MX', 'CO'] }) }))
  })
})
