import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ConsumerUnboundDialog, ConsumerUnboundGuidance } from './consumerWorkspaceGuidance'
import { canOpenEarningsWorkspace } from './consumerWorkspaceView'

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
    expect(markup).not.toContain('href="/earnings"')
  })

  it('links an account-page notice to the existing binding section', () => {
    const markup = renderToStaticMarkup(<ConsumerUnboundGuidance locale="pt" bindHref="#consumer-platform-bindings" />)
    expect(markup).toContain('href="#consumer-platform-bindings"')
  })

  it('allows the earnings tab only when an app workspace is selected', () => {
    expect(canOpenEarningsWorkspace(null)).toBe(false)
    expect(canOpenEarningsWorkspace('TIMO')).toBe(true)
    expect(canOpenEarningsWorkspace('LINKY')).toBe(true)
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
