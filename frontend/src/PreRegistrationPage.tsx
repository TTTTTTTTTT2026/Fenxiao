import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, UserPlus } from '@phosphor-icons/react'
import ConsumerPhoneCountrySelect from './ConsumerPhoneCountrySelect'
import { getPreRegistrations, getPreRegistrationInput, savePreRegistration, withdrawPreRegistration, type PreRegistrationItem, type PreRegistrationList } from './api'
import { preRegistrationCopy } from './preRegistrationCopy'
import type { ConsumerLocale } from './shared/catalog'
import { clientPhoneCountries, initialClientCountry, type ClientCountryCode } from './shared/consumerEntryPreferences'
import { normalizeLocalPhoneNumber } from './shared/legacyFormatting'
import type { SessionState } from './shared/legacySession'

export default function PreRegistrationPage({ session, locale, onLocale, footer }: {
  session: SessionState | null; locale: ConsumerLocale; onLocale: (locale: ConsumerLocale) => void; footer?: ReactNode
}) {
  const words = preRegistrationCopy[locale]
  const [platform, setPlatform] = useState<'TIMO' | 'LINKY'>('TIMO')
  const [country, setCountry] = useState<ClientCountryCode>(() => initialClientCountry(locale, session?.countryCode))
  const [phone, setPhone] = useState('')
  const [account, setAccount] = useState('')
  const [editing, setEditing] = useState<PreRegistrationItem | null>(null)
  const [data, setData] = useState<PreRegistrationList | null>(null)
  const [page, setPage] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [loadError, setLoadError] = useState(false)
  const [result, setResult] = useState<PreRegistrationItem | null>(null)
  const inFlight = useRef(false)
  const loadSequence = useRef(0)
  const heading = useRef<HTMLHeadingElement>(null)
  const selectedCountry = clientPhoneCountries.find(value => value.countryCode === country)!
  const eligible = Boolean(data && (platform === 'TIMO' ? data.canAddTimo : data.canAddLinky))

  const load = useCallback(async (nextPage: number) => {
    if (!session) return
    const sequence = ++loadSequence.current
    try {
      const next = await getPreRegistrations(session.userId, session.accessToken, nextPage)
      if (sequence !== loadSequence.current) return
      setData(next); setLoadError(false)
    } catch { if (sequence === loadSequence.current) setLoadError(true) }
  }, [session])
  useEffect(() => {
    let active = true
    void Promise.resolve().then(() => { if (active) void load(page) })
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible' && !inFlight.current) void load(page) }, 30000)
    return () => { active = false; clearInterval(timer) }
  }, [load, page])

  function message(error: unknown) {
    const value = error instanceof Error ? error.message : ''
    if (value.includes('PRE_PHONE_EXISTS')) return words.duplicatePhone
    if (/PRE_ACCOUNT_EXISTS|PRE_ACCOUNT_RESERVED/.test(value)) return words.duplicateAccount
    if (value.includes('PRE_INVITER_NOT_VERIFIED')) return words.eligibility
    if (/PRE_CLOSED|PRE_STALE_REVISION|PRE_ACCOUNT_CHANGED/.test(value)) return words.changed
    if (value.includes('PRE_INVALID')) return words.invalid
    if (value.includes('PRE_CLAIMED_PHONE_LOCKED')) return words.phoneLocked
    return words.error
  }
  function reset() { setEditing(null); setPhone(''); setAccount(''); setError('') }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session || inFlight.current || !eligible) return
    inFlight.current = true; setBusy(true); setError(''); setResult(null)
    try {
      const next = await savePreRegistration(session.userId, session.accessToken, {
        countryCode: country, phoneNumber: `${selectedCountry.callingCode}${phone}`, platformCode: platform,
        platformUserId: account, ...(editing ? { revision: editing.revision } : {}),
      }, editing?.id)
      reset(); setResult(next); setPage(0); await load(0)
    } catch (err) { setError(message(err)); await load(page) }
    finally { inFlight.current = false; setBusy(false) }
  }
  async function edit(item: PreRegistrationItem) {
    if (!session || inFlight.current) return
    inFlight.current = true; setBusy(true); setError(''); setResult(null)
    try {
      const input = await getPreRegistrationInput(session.userId, session.accessToken, item.id)
      const countryOption = clientPhoneCountries.find(value => value.countryCode === input.countryCode)!
      setCountry(countryOption.countryCode); setPhone(input.phoneNumber.slice(countryOption.callingCode.length))
      setPlatform(input.platformCode); setAccount(input.platformUserId)
      setEditing({ ...item, revision: input.revision ?? item.revision })
      heading.current?.focus(); heading.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch (err) { setError(message(err)); await load(page) }
    finally { inFlight.current = false; setBusy(false) }
  }
  async function withdraw(item: PreRegistrationItem) {
    if (!session || inFlight.current || !window.confirm(words.confirm)) return
    inFlight.current = true; setBusy(true); setError(''); setResult(null)
    try {
      await withdrawPreRegistration(session.userId, session.accessToken, item)
      if (editing?.id === item.id) reset()
      await load(page)
    } catch (err) { setError(message(err)); await load(page) }
    finally { inFlight.current = false; setBusy(false) }
  }
  function date(value: string) {
    const instant = new Date(/Z$|[+-]\d\d:\d\d$/.test(value) ? value : `${value}Z`)
    return Number.isNaN(instant.getTime()) ? '—' : new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' }).format(instant)
  }
  return <div className="consumer-app-page"><main className="consumer-shell consumer-form-shell prereg-page">
    <header className="consumer-topbar"><a className="consumer-brand" href="/earnings">Bandeira</a>
      <label className="consumer-language-select"><select aria-label="Language" value={locale} onChange={event => onLocale(event.target.value as ConsumerLocale)}>
        <option value="zh">中文</option><option value="en">English</option><option value="es">Español</option><option value="id">Bahasa Indonesia</option><option value="pt">Português</option>
      </select></label></header>
    <a className="prereg-back" href="/account/settings"><ArrowLeft aria-hidden="true" />{words.back}</a>
    <section className="consumer-commercial-heading"><h1 ref={heading} tabIndex={-1}>{words.title}</h1><span>{words.subtitle}</span></section>
    {!session ? <a className="consumer-primary-link" href="/invite#phone-login">{words.signIn}<ArrowRight /></a> : <>
      <section className="consumer-settings-card prereg-form-card">
        <form onSubmit={event => void submit(event)}>
          <fieldset disabled={busy}><legend>{words.app}</legend><div className="prereg-tabs">
            {(['TIMO', 'LINKY'] as const).map(code => <button key={code} type="button" aria-pressed={platform === code} className={platform === code ? 'selected' : ''}
              onClick={() => { setPlatform(code); setAccount(''); setError('') }}>{code === 'TIMO' ? 'Timo' : 'Linky'}</button>)}
          </div>
          <label htmlFor="prereg-phone">{words.phone}</label>
          <div className="prereg-phone consumer-phone-input"><ConsumerPhoneCountrySelect countries={clientPhoneCountries} value={country} locale={locale} label={words.phone} disabled={Boolean(editing?.claimed)}
            onChange={value => { setCountry(value); setPhone('') }} />
            <input id="prereg-phone" type="tel" inputMode="tel" autoComplete="off" required pattern="[0-9]{4,17}" maxLength={17} value={phone}
              readOnly={Boolean(editing?.claimed)} onChange={event => setPhone(normalizeLocalPhoneNumber(event.target.value, selectedCountry.callingCode))} />
          </div>
          <label htmlFor="prereg-account">{words.account} · {platform === 'TIMO' ? 'Timo' : 'Linky'}</label>
          <input id="prereg-account" inputMode="numeric" autoComplete="off" required pattern={platform === 'TIMO' ? '[1-9][0-9]{11}' : '[0-9]{8}'}
            maxLength={platform === 'TIMO' ? 12 : 8} value={account} placeholder={platform === 'TIMO' ? '123456789012' : '12345678'}
            onChange={event => setAccount(event.target.value.replace(/\D/g, ''))} />
          <p className="prereg-note">{words.own}</p>
          {editing ? <p className="prereg-note">{words.editing}{editing.claimed ? ` ${words.claimed}` : ''}</p> : null}
          {!eligible && data ? <p className="prereg-notice">{words.eligibility}</p> : null}
          <button className="consumer-form-submit" type="submit" disabled={!eligible || busy}><UserPlus aria-hidden="true" />{busy ? words.busy : editing ? words.save : words.submit}</button>
          {editing ? <button className="prereg-text-button" type="button" onClick={reset}>{words.cancel}</button> : null}
          </fieldset>
        </form>
        <p className="prereg-note">{words.hint}</p>
      </section>
      {error ? <p className="prereg-error" role="alert">{error}</p> : null}
      {result ? <p className="prereg-notice" role="status">{result.status === 'COMPLETED' ? words.completed : words.pending} · {result.maskedPhone}</p> : null}
      <section className="consumer-settings-card prereg-list" aria-labelledby="prereg-list-title">
        <div className="prereg-list-head"><h2 id="prereg-list-title">{words.list}{data ? ` (${data.total})` : ''}</h2><button type="button" disabled={busy} onClick={() => void load(page)}>{words.refresh}</button></div>
        {loadError ? <p role="alert">{words.unavailable}</p> : null}
        {data?.items.length === 0 ? <p className="prereg-note">{words.empty}</p> : null}
        {!data && !loadError ? <p role="status">…</p> : null}
        {data?.items.map(item => <article className="prereg-item" key={item.id}>
          <div className="prereg-item-heading"><strong>{item.maskedPhone}</strong><span className={`prereg-status prereg-status-${item.status.toLowerCase()}`}>{words.status[item.status as keyof typeof words.status] ?? item.status}</span></div>
          <p>{item.countryCode} · {item.platformCode === 'TIMO' ? 'Timo' : 'Linky'} · {item.maskedAccount}</p>
          <p className="prereg-reason">{words.reason[item.reasonCode as keyof typeof words.reason] ?? words.reason.WAITING}</p>
          <dl><div><dt>{words.submitted}</dt><dd>{date(item.submittedAt)}</dd></div><div><dt>{words.expires}</dt><dd>{date(item.expiresAt)}</dd></div>
            {item.lastCheckedAt ? <div><dt>{words.checked}</dt><dd>{date(item.lastCheckedAt)} · {words.attempts} {item.attemptCount}</dd></div> : null}</dl>
          {item.claimed ? <p className="prereg-note">{words.claimed}</p> : null}
          {item.canEdit ? <div className="prereg-item-actions"><button type="button" disabled={busy} onClick={() => void edit(item)}>{words.edit}</button><button type="button" disabled={busy} onClick={() => void withdraw(item)}>{words.withdraw}</button></div> : null}
        </article>)}
        {data && (page > 0 || data.hasNext) ? <div className="prereg-pagination"><button type="button" disabled={page === 0 || busy} onClick={() => setPage(value => value - 1)}>{words.previous}</button><span>{page + 1}</span><button type="button" disabled={!data.hasNext || busy} onClick={() => setPage(value => value + 1)}>{words.next}</button></div> : null}
      </section>
    </>}{footer}
  </main></div>
}
