import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ConsumerUnboundDialog, ConsumerUnboundGuidance } from './consumerWorkspaceGuidance'
import { canOpenEarningsWorkspace, shouldShowTimoEarningsGuide } from './consumerWorkspaceView'
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
    expect(markup).toContain('href="/earnings?app=timo"')
  })

  it('links an account-page notice to the existing binding section', () => {
    const markup = renderToStaticMarkup(<ConsumerUnboundGuidance locale="pt" bindHref="#consumer-platform-bindings" />)
    expect(markup).toContain('href="#consumer-platform-bindings"')
  })

  it('opens the earnings tab for a selected workspace or a known Timo preference', () => {
    expect(canOpenEarningsWorkspace(unboundWorkspace)).toBe(false)
    expect(canOpenEarningsWorkspace({ ...unboundWorkspace, preferred: 'TIMO' })).toBe(true)
    expect(canOpenEarningsWorkspace({ ...unboundWorkspace, selected: 'TIMO' })).toBe(true)
    expect(canOpenEarningsWorkspace({ ...unboundWorkspace, selected: 'LINKY' })).toBe(true)
  })

  it('shows an in-place dialog with binding actions and a close button', () => {
    const markup = renderToStaticMarkup(<ConsumerUnboundDialog locale="pt" onClose={() => undefined} />)
    expect(markup).toContain('role="dialog"')
    expect(markup).toContain('aria-modal="true"')
    expect(markup).toContain('href="/account/timo"')
    expect(markup).toContain('href="/account/linky"')
    expect(markup).toContain('Entendi')
  })

  it('does not claim the app is unbound when its status cannot be checked', () => {
    const markup = renderToStaticMarkup(<ConsumerUnboundDialog locale="zh" error onClose={() => undefined} />)
    expect(markup).toContain('暂时无法确认绑定状态')
    expect(markup).not.toContain('尚未完成应用绑定')
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

describe('Timo earnings guide routing', () => {
  it('needs Timo intent and leaves a selected Linky workspace alone', () => {
    expect(shouldShowTimoEarningsGuide(unboundWorkspace)).toBe(false)
    expect(shouldShowTimoEarningsGuide(unboundWorkspace, true)).toBe(true)
    expect(shouldShowTimoEarningsGuide({ ...unboundWorkspace, selected: 'TIMO' })).toBe(true)
    expect(shouldShowTimoEarningsGuide({ ...unboundWorkspace, selected: 'LINKY' }, true)).toBe(false)
  })

  it.each([
    { verified: false, earningsReadable: true },
    { verified: true, earningsReadable: undefined },
  ])('keeps existing Timo earnings for a readable workspace (%o)', (access) => {
    const [timo, linky] = unboundWorkspace.apps
    const workspace = { ...unboundWorkspace, selected: 'TIMO' as const, apps: [{ ...timo, ...access }, linky] }
    expect(shouldShowTimoEarningsGuide(workspace, true)).toBe(false)
  })
})
