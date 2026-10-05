import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ConsumerUnboundGuidance } from './consumerWorkspaceGuidance'

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
})
