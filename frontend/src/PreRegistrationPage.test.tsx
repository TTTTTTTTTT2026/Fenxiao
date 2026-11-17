import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import PreRegistrationPage from './PreRegistrationPage'
import { getPreRegistrations, getPreRegistrationInput, savePreRegistration, withdrawPreRegistration } from './api'

const session = { userId: 101, accessToken: 'fixture-session', countryCode: 'ID', languageCode: 'id', inviteCode: 'FIXTURE' }
describe('subordinate pre-registration', () => {
  afterEach(() => vi.unstubAllGlobals())
  it.each(['zh', 'en', 'es', 'id', 'pt'] as const)('renders registration country selection and the app form in %s', locale => {
    const html = renderToStaticMarkup(<PreRegistrationPage session={session} locale={locale} onLocale={() => undefined} />)
    expect(html).toContain('prereg-phone')
    expect(html).toContain('value="ID" selected=""')
    expect(html).toContain('[1-9][0-9]{11}')
    expect(html).toContain('72')
    expect(html).toContain('Timo')
    expect(html).toContain('Linky')
    expect(html).not.toContain('undefined')
  })
  it('does not show the submission form without a session', () => {
    const html = renderToStaticMarkup(<PreRegistrationPage session={null} locale="zh" onLocale={() => undefined} />)
    expect(html).toContain('请先登录')
    expect(html).not.toContain('id="prereg-phone"')
  })
  it('authenticates create, edit, list and withdraw and preserves revision', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    vi.stubGlobal('fetch', fetchMock)
    const input = { countryCode: 'BR', phoneNumber: '+5500000000000', platformCode: 'LINKY' as const, platformUserId: '12345678', revision: 4 }
    await savePreRegistration(101, session.accessToken, input)
    await savePreRegistration(101, session.accessToken, input, 7)
    await getPreRegistrationInput(101, session.accessToken, 7)
    await getPreRegistrations(101, session.accessToken, 2)
    await withdrawPreRegistration(101, session.accessToken, { id: 7, revision: 4 } as Parameters<typeof withdrawPreRegistration>[2])
    const calls = fetchMock.mock.calls
    expect(calls[0][0]).toBe('/api/distribution/team/101/pre-registrations')
    expect(calls[0][1]).toMatchObject({ method: 'POST', body: JSON.stringify(input) })
    expect(calls[1][1]).toMatchObject({ method: 'PATCH', body: JSON.stringify(input) })
    expect(calls[2][0]).toContain('/7/edit-input')
    expect(calls[3][0]).toContain('page=2')
    expect(calls[4][0]).toContain('/7?revision=4')
    expect(calls[4][1]).toMatchObject({ method: 'DELETE' })
    for (const [, init] of calls) expect(init.headers).toMatchObject({ 'X-Distribution-Token': session.accessToken })
  })
})
