import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import InviterBindingDialog from './InviterBindingDialog'
import { submitInviteeBinding } from './api'

const target = { userId: 102, maskedPhone: '+628****1234', registeredAt: '2026-11-01', bindingStatus: 'UNBOUND', canBind: true }
const noop = () => undefined

describe('inviter assisted binding', () => {
  afterEach(() => vi.unstubAllGlobals())

  it.each(['TIMO', 'LINKY'] as const)('shows the invitee identity and the %s account format', platform => {
    const html = renderToStaticMarkup(<InviterBindingDialog inviterId={101} accessToken="fixture" platform={platform}
      item={target} locale="zh" onClose={noop} onSubmitted={noop} onRefresh={noop} />)
    expect(html).toContain('#102')
    expect(html).toContain('+628****1234')
    expect(html).toContain('被邀请人本人的应用数字 ID')
    expect(html).toContain(platform === 'TIMO' ? '[1-9][0-9]{11}' : '[0-9]{8}')
    expect(html).toContain('aria-labelledby="assisted-binding-title"')
  })

  it.each(['zh', 'en', 'es', 'id', 'pt'] as const)('provides localized confirmation in %s', locale => {
    const html = renderToStaticMarkup(<InviterBindingDialog inviterId={101} accessToken="fixture" platform="TIMO"
      item={target} locale={locale} onClose={noop} onSubmitted={noop} onRefresh={noop} />)
    expect(html).toContain('#102')
    expect(html).not.toContain('undefined')
    if (locale !== 'zh') expect(html).not.toContain('提交核验')
  })

  it('authenticates the inviter while submitting the invitee and app explicitly', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => target })
    vi.stubGlobal('fetch', fetchMock)
    await submitInviteeBinding(101, 102, 'inviter-session', 'LINKY', '12345678')
    expect(fetchMock).toHaveBeenCalledWith('/api/distribution/team/101/invitees/102/bindings', expect.objectContaining({
      method: 'POST', headers: expect.objectContaining({ 'X-Distribution-Token': 'inviter-session' }),
      body: JSON.stringify({ platformCode: 'LINKY', platformUserId: '12345678' }),
    }))
  })
})
