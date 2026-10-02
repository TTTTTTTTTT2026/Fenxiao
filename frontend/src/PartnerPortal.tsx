import { useEffect, useState, type FormEvent } from 'react'
import { logoutUserSession, passwordLogin, refreshUserSession, type ProfileResponse } from './api'
import { formatPartnerPhone, normalizePartnerLocalPhone, partnerPhoneCountries, type PartnerLanguage } from './partnerPhone'
import './PartnerPortal.css'

const STORAGE_KEY = 'bandeira-partner-session'

const copy = {
  zh: { title: '伙伴工作台', subtitle: '使用已开通密码登录的现有分销账号。', country: '国家／地区', chooseCountry: '选择国家／地区', phone: '手机号码', phoneHint: '仅输入本地手机号码，无需输入国家区号', password: '密码', login: '登录', failure: '登录失败，请核对手机号、密码及开通状态。', welcome: '已登录', pending: '工作台功能正在准备中', pendingDetail: '目前不展示业务数据，也不提供管理操作。', logout: '退出登录', loading: '正在验证登录状态…' },
  en: { title: 'Partner workspace', subtitle: 'Use an existing distribution account with password sign-in enabled.', country: 'Country / region', chooseCountry: 'Select country / region', phone: 'Phone number', phoneHint: 'Enter your local number only; no calling code', password: 'Password', login: 'Sign in', failure: 'Sign-in failed. Check the number, password and access status.', welcome: 'Signed in', pending: 'Workspace features are coming', pendingDetail: 'No business data or management actions are available yet.', logout: 'Sign out', loading: 'Checking your session…' },
  id: { title: 'Ruang kerja mitra', subtitle: 'Gunakan akun distribusi yang sudah diaktifkan untuk masuk dengan kata sandi.', country: 'Negara / wilayah', chooseCountry: 'Pilih negara / wilayah', phone: 'Nomor ponsel', phoneHint: 'Masukkan nomor lokal saja, tanpa kode negara', password: 'Kata sandi', login: 'Masuk', failure: 'Gagal masuk. Periksa nomor, kata sandi, dan status akses.', welcome: 'Sudah masuk', pending: 'Fitur ruang kerja sedang disiapkan', pendingDetail: 'Data bisnis dan tindakan pengelolaan belum tersedia.', logout: 'Keluar', loading: 'Memeriksa sesi…' },
  pt: { title: 'Área de parceiros', subtitle: 'Use uma conta existente habilitada para acesso com senha.', country: 'País / região', chooseCountry: 'Selecione o país / região', phone: 'Número de telefone', phoneHint: 'Digite apenas o número local, sem código do país', password: 'Senha', login: 'Entrar', failure: 'Falha no acesso. Confira o número, a senha e a permissão.', welcome: 'Conectado', pending: 'A área de trabalho está em preparação', pendingDetail: 'Ainda não há dados de negócios nem ações de gerenciamento.', logout: 'Sair', loading: 'Verificando sessão…' },
  es: { title: 'Espacio de socios', subtitle: 'Usa una cuenta existente habilitada para iniciar sesión con contraseña.', country: 'País / región', chooseCountry: 'Selecciona país / región', phone: 'Número de teléfono', phoneHint: 'Ingresa solo tu número local, sin prefijo internacional', password: 'Contraseña', login: 'Iniciar sesión', failure: 'No se pudo iniciar sesión. Revisa el número, la contraseña y el acceso.', welcome: 'Sesión iniciada', pending: 'El espacio de trabajo está en preparación', pendingDetail: 'Aún no hay datos comerciales ni funciones de gestión.', logout: 'Cerrar sesión', loading: 'Verificando la sesión…' },
} satisfies Record<PartnerLanguage, Record<string, string>>

function storedSession(): ProfileResponse | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as ProfileResponse
    return session.accessToken && Number.isSafeInteger(session.userId) ? session : null
  } catch {
    return null
  }
}

export default function PartnerPortal() {
  const [language, setLanguage] = useState<PartnerLanguage>(() => {
    const saved = window.localStorage.getItem('bandeira-partner-language')
    return saved && saved in copy ? saved as PartnerLanguage : 'zh'
  })
  const [session, setSession] = useState<ProfileResponse | null>(null)
  const [checking, setChecking] = useState(() => storedSession() !== null)
  const [countryCode, setCountryCode] = useState('')
  const [localPhone, setLocalPhone] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const t = copy[language]
  const selectedCountry = partnerPhoneCountries.find((country) => country.countryCode === countryCode)

  useEffect(() => {
    const saved = storedSession()
    if (!saved) return
    let active = true
    refreshUserSession(saved.accessToken).then((renewed) => {
      if (!active) return
      const next = { ...saved, accessToken: renewed.accessToken }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      setSession(next)
    }).catch(() => {
      if (active) window.localStorage.removeItem(STORAGE_KEY)
    }).finally(() => { if (active) setChecking(false) })
    return () => { active = false }
  }, [])

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedCountry || !localPhone) return
    setBusy(true)
    setError('')
    try {
      const next = await passwordLogin({ phoneNumber: formatPartnerPhone(selectedCountry.callingCode, localPhone), password })
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      setSession(next)
      setPassword('')
    } catch {
      setError(t.failure)
    } finally {
      setBusy(false)
    }
  }

  async function logout() {
    const token = session?.accessToken
    window.localStorage.removeItem(STORAGE_KEY)
    setSession(null)
    if (token) await logoutUserSession(token).catch(() => undefined)
  }

  return <main className="partner-page">
    <div className="partner-topbar">
      <span className="partner-brand"><span className="partner-brand-mark">◆</span> BANDEIRA</span>
      <select aria-label="Language" value={language} onChange={(event) => {
        const next = event.target.value as PartnerLanguage
        window.localStorage.setItem('bandeira-partner-language', next)
        setLanguage(next)
      }}>
        <option value="zh">中文</option><option value="en">English</option><option value="id">Bahasa Indonesia</option><option value="pt">Português</option><option value="es">Español</option>
      </select>
    </div>
    <section className="partner-card">
      <p className="partner-eyebrow">BANDEIRA PARTNER</p>
      <h1>{t.title}</h1>
      {checking ? <p role="status">{t.loading}</p> : session ? <>
        <p className="partner-intro">{t.welcome} · ID {session.userId}</p>
        <div className="partner-empty-state"><h2>{t.pending}</h2><p>{t.pendingDetail}</p></div>
        <button className="partner-secondary" type="button" onClick={logout}>{t.logout}</button>
      </> : <>
        <p className="partner-intro">{t.subtitle}</p>
        <form onSubmit={login}>
          <label htmlFor="partner-phone">{t.phone}</label>
          <div className="partner-phone-input">
            <select aria-label={t.country} value={countryCode} onChange={(event) => setCountryCode(event.target.value)} required>
              <option value="" disabled>{t.chooseCountry}</option>
              {partnerPhoneCountries.map((country) => <option key={country.countryCode} value={country.countryCode}>{country.names[language]} {country.callingCode}</option>)}
            </select>
            <input id="partner-phone" type="tel" autoComplete="username" inputMode="numeric" pattern="[0-9]+" placeholder={t.phone} value={localPhone} onChange={(event) => setLocalPhone(normalizePartnerLocalPhone(event.target.value, selectedCountry?.callingCode ?? ''))} required />
          </div>
          <small className="partner-phone-hint">{t.phoneHint}</small>
          <label htmlFor="partner-password">{t.password}</label>
          <input id="partner-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          {error ? <p className="partner-error" role="alert">{error}</p> : null}
          <button className="partner-primary" type="submit" disabled={busy}>{t.login}</button>
        </form>
      </>}
    </section>
  </main>
}
