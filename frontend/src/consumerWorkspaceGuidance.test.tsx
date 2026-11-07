import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ConsumerUnboundGuidance } from './consumerWorkspaceGuidance'
import { earningsHref, earningsPlatformFromSearch, resolveEarningsPlatform } from './consumerEarningsPlatform'
import { canReadAppEarnings } from './consumerWorkspaceView'
import type { ConsumerWorkspaceResponse } from './api'

describe('consumer unbound workspace guidance', () => {
  it.each([
    ['zh', '尚未完成应用绑定', '去绑定应用'],
    ['en', 'No verified app account yet', 'Link an app'],
    ['es', 'Aún no tienes una cuenta de aplicación verificada', 'Vincular aplicación'],
    ['id', 'Belum ada akun aplikasi yang terverifikasi', 'Hubungkan aplikasi'],
    ['pt', 'Nenhuma conta de aplicativo verificada', 'Vincular aplicativo'],
  ] as const)('localizes the notice for %s', (locale, title, action) => {
    const markup = renderToStaticMarkup(<ConsumerUnboundGuidance locale={locale} />)
    expect(markup).toContain(title)
    expect(markup).toContain(action)
    expect(markup).toContain('href="/account"')
    expect(markup).toContain('role="status"')
  })

  it('offers both app binding paths on locked earnings screens', () => {
    const markup = renderToStaticMarkup(<ConsumerUnboundGuidance locale="zh" variant="gate" />)
    expect(markup).toContain('绑定 Timo')
    expect(markup).toContain('绑定 Linky')
    expect(markup).toContain('href="/account/timo"')
    expect(markup).toContain('href="/account/linky"')
  })

  it('links an account-page notice to the existing binding section', () => {
    const markup = renderToStaticMarkup(<ConsumerUnboundGuidance locale="pt" bindHref="#consumer-platform-bindings" />)
    expect(markup).toContain('href="#consumer-platform-bindings"')
  })
})

const unboundWorkspace: ConsumerWorkspaceResponse = {
  selected: null,
  preferred: null,
  apps: [
    { code: 'TIMO', verified: false, verifiedAt: null, earningsReadable: false },
    { code: 'LINKY', verified: false, verifiedAt: null, earningsReadable: false },
  ],
}

describe('earnings platform navigation', () => {
  it('defaults to Timo when there is no workspace choice', () => {
    expect(resolveEarningsPlatform(unboundWorkspace, null)).toBe('TIMO')
    expect(resolveEarningsPlatform({ ...unboundWorkspace, preferred: 'LINKY' }, null)).toBe('LINKY')
    expect(resolveEarningsPlatform({ ...unboundWorkspace, selected: 'LINKY' }, null)).toBe('LINKY')
  })

  it('opens a newly verified app even when a different app was previously selected', () => {
    const workspace = { ...unboundWorkspace, selected: 'TIMO' as const }
    expect(resolveEarningsPlatform(workspace, earningsPlatformFromSearch('?app=linky'))).toBe('LINKY')
    expect(resolveEarningsPlatform(workspace, earningsPlatformFromSearch('?app=invalid'))).toBe('TIMO')
    expect(earningsHref('/earnings/commission?startDate=2026-11-07#summary', 'LINKY'))
      .toBe('/earnings/commission?startDate=2026-11-07&app=linky#summary')
  })

  it('does not turn a tab choice into a grant or verification', () => {
    const platform = resolveEarningsPlatform(unboundWorkspace, 'LINKY')
    const app = unboundWorkspace.apps.find((item) => item.code === platform)!
    expect(canReadAppEarnings(app)).toBe(false)
    expect(canReadAppEarnings({ ...app, earningsReadable: true })).toBe(true)
  })
})
