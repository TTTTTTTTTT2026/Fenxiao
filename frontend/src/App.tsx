import {
ArrowRight,
Bell,
CaretRight,
CheckCircle,
Copy,
Diamond,
Eye,
EyeSlash,
IdentificationCard,
LinkSimple,
LockSimple,
Medal,
ShareNetwork,
ShieldCheck,
SignIn,
SignOut,
Sparkle,
Target,
User,
UserCircle,
UserPlus,
UsersThree,
Wallet,
} from '@phosphor-icons/react'
import { useEffect,useRef,useState,type FormEvent,type MouseEvent as ReactMouseEvent } from 'react'
import {
getConsumerWorkspace,
getDistributionEffectiveTeam,
getDistributionHome,
getDistributionInvitationAccount,
getInvitationCommissionReport,
getInvitationCommissionSources,
getPlatformBinding,
getUserPublicProfile,
getVerifiedLinkyAccountBinding,
issuePhoneCode,
logoutUserSession,
passwordLogin,
phoneLogin,
registerLinkyAccount,
selectConsumerWorkspace,
submitPlatformBinding,
updateUserAvatar,
updateUserNickname,
verifyPlatformBinding,
type ConsumerWorkspaceResponse,
type DistributionHomeResponse,
type EffectiveTeamResponse,
type InvitationCommissionReportResponse,
type InvitationCommissionSourceResponse,
type InvitationRewardAccountResponse,
type InviteBindingResponse,
type LinkyAccountBindingResponse,
type PlatformBindingResponse,
type UserPublicProfileResponse
} from './api'
import './App.css'
import loginHeroEn1600 from './assets/login-hero/login-hero-en-v1-1600.webp'
import loginHeroEn800 from './assets/login-hero/login-hero-en-v1-800.webp'
import loginHeroEs1600 from './assets/login-hero/login-hero-es-v1-1600.webp'
import loginHeroEs800 from './assets/login-hero/login-hero-es-v1-800.webp'
import loginHeroId1600 from './assets/login-hero/login-hero-id-v1-1600.webp'
import loginHeroId800 from './assets/login-hero/login-hero-id-v1-800.webp'
import loginHeroPt1600 from './assets/login-hero/login-hero-pt-BR-v1-1600.webp'
import loginHeroPt800 from './assets/login-hero/login-hero-pt-BR-v1-800.webp'
import loginHeroZh1600 from './assets/login-hero/login-hero-zh-v1-1600.webp'
import loginHeroZh800 from './assets/login-hero/login-hero-zh-v1-800.webp'
import { isAvatarValidationError,prepareAvatarDataUrl } from './avatarUpload'
import InvitationProgressPanel from './InvitationProgressPanel'
import { ConsumerUnboundDialog,ConsumerUnboundGuidance } from './consumerWorkspaceGuidance'
import { canOpenEarningsWorkspace,resolveConsumerAccountWorkspace } from './consumerWorkspaceView'
import { effectiveTeamCount } from './consumerTeamState'
import PartnerPortal from './PartnerPortal'
import { internalPhoneCodeNotice } from './phoneCodeNotice'
import { consumerEntryOrigin } from './publicEntries'
import { formatConsumerUserGrade,phoneCountries,type ConsumerLocale } from './shared/catalog'
import { CLIENT_COUNTRY_KEY,initialClientCountry,languageForLocale,suggestedClientCountry,type ClientCountryCode } from './shared/consumerEntryPreferences'
import { formatMoney,formatPhoneNumber,normalizeLocalPhoneNumber } from './shared/legacyFormatting'
import { EXTERNAL_LOCALE_KEY,loadExternalLocale,loadJsonState,saveUserSession,STORAGE_KEY,type SessionState } from './shared/legacySession'

import { ConsoleApp } from './admin/LegacyAdminApp'

const linkyGuildMismatchCopy: Record<ConsumerLocale, string> = {
  zh: '当前账号与被邀请人不属于同一个公会，绑定失败',
  en: 'This account and the inviting user are not in the same guild. Binding failed.',
  es: 'Esta cuenta y la persona que invitó no pertenecen al mismo gremio. La vinculación falló.',
  id: 'Akun ini dan pengundang tidak berada di guild yang sama. Pengikatan gagal.',
  pt: 'Esta conta e quem fez o convite não pertencem à mesma guilda. A vinculação falhou.',
}

const linkyBindingErrorCopy: Record<ConsumerLocale, { configuration: string; duplicateAccount: string; duplicatePhone: string; unavailable: string; generic: string }> = {
  zh: { configuration: '当前邀请路径尚未配置可核验的 Linky 公会，请联系运营人员。', duplicateAccount: '这个 Linky 账号已被绑定。', duplicatePhone: '这个手机号已被登记。', unavailable: 'Linky 核验暂时不可用，请稍后重试。', generic: '绑定未完成，请稍后重试或联系运营人员。' },
  en: { configuration: 'This invitation route has no eligible Linky guild yet. Please contact support.', duplicateAccount: 'This Linky account is already bound.', duplicatePhone: 'This phone number is already registered.', unavailable: 'Linky verification is temporarily unavailable. Try again later.', generic: 'Binding could not be completed. Try again later or contact support.' },
  es: { configuration: 'Esta ruta de invitación aún no tiene un gremio Linky válido. Contacta al equipo de soporte.', duplicateAccount: 'Esta cuenta Linky ya está vinculada.', duplicatePhone: 'Este número de teléfono ya está registrado.', unavailable: 'La verificación de Linky no está disponible por ahora. Inténtalo más tarde.', generic: 'No se pudo completar la vinculación. Inténtalo más tarde o contacta al equipo de soporte.' },
  id: { configuration: 'Jalur undangan ini belum memiliki guild Linky yang dapat diverifikasi. Hubungi tim dukungan.', duplicateAccount: 'Akun Linky ini sudah terhubung.', duplicatePhone: 'Nomor telepon ini sudah terdaftar.', unavailable: 'Verifikasi Linky sementara tidak tersedia. Coba lagi nanti.', generic: 'Penghubungan akun belum selesai. Coba lagi nanti atau hubungi tim dukungan.' },
  pt: { configuration: 'Esta rota de convite ainda não tem uma guilda Linky válida. Entre em contato com o suporte.', duplicateAccount: 'Esta conta Linky já está vinculada.', duplicatePhone: 'Este número de telefone já está cadastrado.', unavailable: 'A verificação do Linky está temporariamente indisponível. Tente novamente mais tarde.', generic: 'Não foi possível concluir o vínculo. Tente novamente mais tarde ou entre em contato com o suporte.' },
}

// eslint-disable-next-line react-refresh/only-export-components
export function isLinkyGuildMismatch(message: string) {
  return /Linky account is not in (?:the )?expected guild|Please join expected Linky guild|Linky account joined another guild/i.test(message)
}

// eslint-disable-next-line react-refresh/only-export-components
export function localizeLinkyBindingError(message: string, locale: ConsumerLocale) {
  if (isLinkyGuildMismatch(message)) return linkyGuildMismatchCopy[locale]
  const normalized = message.toLowerCase()
  const copy = linkyBindingErrorCopy[locale]
  if (normalized.includes('invitation route is mapped to an active mcn guild') || normalized.includes('expected_guild_not_mcn_allowlisted')) return copy.configuration
  if (normalized.includes('linky account already registered') || normalized.includes('linky account already bound')) return copy.duplicateAccount
  if (normalized.includes('whatsapp number already registered') || normalized.includes('phone number already registered')) return copy.duplicatePhone
  if (normalized.includes('linky verification is temporarily unavailable')) return copy.unavailable
  return copy.generic
}

function BindLandingPage() {
  const copyByLocale = {
    zh: {
      languageLabel: '语言',
      productLabel: '产品',
      productHelper: '暂时仅开放 Linky',
      kicker: 'FLEXIBLE REMOTE REWARD PROGRAM',
      heroTitle: '先绑定邀请码，锁定后续奖励归属',
      heroSubtitle: '填写邀请码、WhatsApp 和 8 位账号，先把关系登记进去。',
      chips: ['居家灵活用工', '金币奖励链路', '手机即可开始'],
      floating: ['🏠 居家', '📱 手机', '🪙 金币'],
      stats: ['先绑定', '再推广', '后归因'],
      formTitle: '现在提交，锁定你的奖励线',
      formSubtitle: '只做一个动作：先把关系登记进去。',
      inviteCode: '邀请码',
      inviteCodePlaceholder: '例如 ABCD1234',
      whatsappNumber: 'WhatsApp 号码',
      whatsappPlaceholder: '例如 +6281234567890',
      linkyAccount: 'App 账户（8位数字）',
      linkyPlaceholder: '例如 12345678',
      submit: '立即开始锁定奖励关系',
      submitting: '提交中...',
      failure: '登记失败',
      success: '登记成功',
      successText: '关系已写入系统，后续归因按当前邀请码记录。',
      factsTitle: '基本原理',
      fact1: '一个 Linky 账号只能归属一个邀请码。',
      fact2: 'WhatsApp 号码唯一，重复登记会被拒绝。',
      fact3: '填错后不能自己改绑，只能后台修正。',
      stepsTitle: '怎么做',
      step1: '拿到邀请码',
      step2: '填 WhatsApp',
      step3: '填 8 位账号并提交',
      foot1: '邀请码固定',
      foot2: '立即生效',
      foot3: '后续按此归因',
      resultTitle: '当前结果',
      resultWritten: '这次绑定已经写入系统',
      inviterUserId: '邀请人用户 ID',
      status: '状态',
      navBind: '绑定页',
      navInvite: '邀请好友',
      navEarnings: '我的收益',
    },
    en: {
      languageLabel: 'Language',
      productLabel: 'Product',
      productHelper: 'Linky only for now',
      kicker: 'FLEXIBLE REMOTE REWARD PROGRAM',
      heroTitle: 'Use your phone from home. Bind the invite code first and lock your reward line.',
      heroSubtitle: 'Simple rule: register invite code + WhatsApp + 8-digit account first, then future attribution and rewards follow this line.',
      chips: ['Remote flexible work', 'Coin reward flow', 'Phone-first start'],
      floating: ['🏠 Home', '📱 Phone', '🪙 Coins'],
      stats: ['Bind first', 'Promote next', 'Reward later'],
      formTitle: 'Submit now and lock your reward line',
      formSubtitle: 'One action only: register the relationship first.',
      inviteCode: 'Invite code',
      inviteCodePlaceholder: 'e.g. ABCD1234',
      whatsappNumber: 'WhatsApp number',
      whatsappPlaceholder: 'e.g. +6281234567890',
      linkyAccount: 'App account (8 digits)',
      linkyPlaceholder: 'e.g. 12345678',
      submit: 'Lock my reward relationship now',
      submitting: 'Submitting...',
      failure: 'Failed',
      success: 'Success',
      successText: 'The relationship is saved. Future attribution follows this invite code.',
      factsTitle: 'How it works',
      fact1: 'One Linky account can belong to one invite code only.',
      fact2: 'WhatsApp number must be unique.',
      fact3: 'Wrong submissions can only be fixed by support.',
      stepsTitle: 'Steps',
      step1: 'Get the invite code',
      step2: 'Enter WhatsApp',
      step3: 'Enter 8-digit account and submit',
      foot1: 'Fixed invite code',
      foot2: 'Live immediately',
      foot3: 'Future rewards follow this record',
      resultTitle: 'Current result',
      resultWritten: 'This binding has been saved',
      inviterUserId: 'Inviter user ID',
      status: 'Status',
      navBind: 'Binding page',
      navInvite: 'Generate my invite code',
      navEarnings: 'View my team earnings',
    },
    es: {
      languageLabel: 'Idioma',
      productLabel: 'Producto',
      productHelper: 'Solo Linky por ahora',
      kicker: 'FLEXIBLE REMOTE REWARD PROGRAM',
      heroTitle: 'Trabaja desde casa con tu móvil. Vincula primero el código y bloquea tu línea de recompensa.',
      heroSubtitle: 'Regla simple: primero registra código + WhatsApp + cuenta de 8 dígitos, luego la atribución y las recompensas seguirán esta línea.',
      chips: ['Trabajo remoto flexible', 'Flujo de monedas', 'Empieza con tu móvil'],
      floating: ['🏠 Casa', '📱 Móvil', '🪙 Monedas'],
      stats: ['Vincula primero', 'Promociona después', 'Recompensa luego'],
      formTitle: 'Envía ahora y bloquea tu línea de recompensa',
      formSubtitle: 'Solo una acción: registra primero la relación.',
      inviteCode: 'Código de invitación',
      inviteCodePlaceholder: 'ej. ABCD1234',
      whatsappNumber: 'Número de WhatsApp',
      whatsappPlaceholder: 'ej. +6281234567890',
      linkyAccount: 'Cuenta de la app (8 dígitos)',
      linkyPlaceholder: 'ej. 12345678',
      submit: 'Bloquear mi recompensa ahora',
      submitting: 'Enviando...',
      failure: 'Error',
      success: 'Éxito',
      successText: 'La relación fue guardada. La atribución futura seguirá este código.',
      factsTitle: 'Cómo funciona',
      fact1: 'Una cuenta Linky solo puede pertenecer a un código.',
      fact2: 'El número de WhatsApp debe ser único.',
      fact3: 'Los errores solo pueden corregirse manualmente.',
      stepsTitle: 'Pasos',
      step1: 'Consigue el código',
      step2: 'Ingresa WhatsApp',
      step3: 'Ingresa la cuenta de 8 dígitos y envía',
      foot1: 'Código fijo',
      foot2: 'Activo al instante',
      foot3: 'Recompensas futuras siguen este registro',
      resultTitle: 'Resultado actual',
      resultWritten: 'Este vínculo ya fue guardado',
      inviterUserId: 'ID del invitador',
      status: 'Estado',
      navBind: 'Página de vínculo',
      navInvite: 'Generar mi código',
      navEarnings: 'Ver ganancias de mi equipo',
    },
    id: {
      languageLabel: 'Bahasa',
      productLabel: 'Produk',
      productHelper: 'Untuk sementara hanya Linky',
      kicker: 'FLEXIBLE REMOTE REWARD PROGRAM',
      heroTitle: 'Kerja fleksibel dari rumah pakai HP. Ikat kode undangan dulu, lalu kunci jalur reward kamu.',
      heroSubtitle: 'Aturannya sederhana: daftarkan kode undangan + WhatsApp + akun 8 digit dulu, lalu atribusi dan reward berikutnya akan mengikuti jalur ini.',
      chips: ['Kerja fleksibel dari rumah', 'Alur reward koin', 'Mulai lewat HP'],
      floating: ['🏠 Rumah', '📱 HP', '🪙 Koin'],
      stats: ['Bind dulu', 'Promosi berikutnya', 'Reward belakangan'],
      formTitle: 'Kirim sekarang dan kunci jalur reward kamu',
      formSubtitle: 'Cuma satu langkah: daftar relasinya dulu.',
      inviteCode: 'Kode undangan',
      inviteCodePlaceholder: 'contoh ABCD1234',
      whatsappNumber: 'Nomor WhatsApp',
      whatsappPlaceholder: 'contoh +6281234567890',
      linkyAccount: 'Akun app (8 digit)',
      linkyPlaceholder: 'contoh 12345678',
      submit: 'Kunci relasi reward saya sekarang',
      submitting: 'Mengirim...',
      failure: 'Gagal',
      success: 'Berhasil',
      successText: 'Relasi sudah disimpan. Atribusi berikutnya mengikuti kode ini.',
      factsTitle: 'Cara kerja',
      fact1: 'Satu akun Linky hanya bisa dimiliki satu kode undangan.',
      fact2: 'Nomor WhatsApp harus unik.',
      fact3: 'Jika salah isi, hanya bisa diperbaiki manual.',
      stepsTitle: 'Langkah',
      step1: 'Ambil kode undangan',
      step2: 'Isi WhatsApp',
      step3: 'Isi akun 8 digit lalu kirim',
      foot1: 'Kode tetap',
      foot2: 'Langsung aktif',
      foot3: 'Reward berikutnya ikut catatan ini',
      resultTitle: 'Hasil saat ini',
      resultWritten: 'Binding ini sudah tersimpan',
      inviterUserId: 'ID pengundang',
      status: 'Status',
      navBind: 'Halaman bind',
      navInvite: 'Buat kode undangan saya',
      navEarnings: 'Lihat penghasilan tim saya',
    },
    pt: {
      languageLabel: 'Idioma',
      productLabel: 'Produto',
      productHelper: 'Apenas Linky por enquanto',
      kicker: 'FLEXIBLE REMOTE REWARD PROGRAM',
      heroTitle: 'Trabalhe de casa com o celular. Vincule o código primeiro e bloqueie sua linha de recompensa.',
      heroSubtitle: 'Regra simples: registre primeiro código + WhatsApp + conta de 8 dígitos, depois a atribuição e as recompensas seguirão esta linha.',
      chips: ['Trabalho remoto flexível', 'Fluxo de moedas', 'Comece pelo celular'],
      floating: ['🏠 Casa', '📱 Celular', '🪙 Moedas'],
      stats: ['Vincule primeiro', 'Divulgue depois', 'Receba recompensas depois'],
      formTitle: 'Envie agora e bloqueie sua linha de recompensa',
      formSubtitle: 'Uma ação só: registre a relação primeiro.',
      inviteCode: 'Código de convite',
      inviteCodePlaceholder: 'ex. ABCD1234',
      whatsappNumber: 'Número do WhatsApp',
      whatsappPlaceholder: 'ex. +6281234567890',
      linkyAccount: 'Conta do app (8 dígitos)',
      linkyPlaceholder: 'ex. 12345678',
      submit: 'Bloquear minha recompensa agora',
      submitting: 'Enviando...',
      failure: 'Falha',
      success: 'Sucesso',
      successText: 'A relação foi salva. A atribuição futura seguirá este código.',
      factsTitle: 'Como funciona',
      fact1: 'Uma conta Linky só pode pertencer a um código.',
      fact2: 'O número de WhatsApp deve ser único.',
      fact3: 'Erros só podem ser corrigidos manualmente.',
      stepsTitle: 'Passos',
      step1: 'Pegue o código',
      step2: 'Digite o WhatsApp',
      step3: 'Digite a conta de 8 dígitos e envie',
      foot1: 'Código fixo',
      foot2: 'Ativo na hora',
      foot3: 'Próximas recompensas seguem este registro',
      resultTitle: 'Resultado atual',
      resultWritten: 'Este vínculo já foi salvo',
      inviterUserId: 'ID do convidador',
      status: 'Status',
      navBind: 'Página de vínculo',
      navInvite: 'Gerar meu código',
      navEarnings: 'Ver ganhos da minha equipe',
    },
  } as const

  const [session] = useState<SessionState | null>(() => loadJsonState<SessionState>(STORAGE_KEY))
  const [locale, setLocale] = useState<keyof typeof copyByLocale>(() => loadExternalLocale())
  const product = 'linky'
  const [linkyAccount, setLinkyAccount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<InviteBindingResponse | null>(null)

  const copy = copyByLocale[locale]
  const accountCopy = consumerAccountCopy[locale]
  const guildMismatch = error ? isLinkyGuildMismatch(error) : false
  const localizedBindingError = error ? localizeLinkyBindingError(error, locale) : ''
  const canSubmit = Boolean(session && linkyAccount.length === 8)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(EXTERNAL_LOCALE_KEY, locale)
    }
  }, [locale])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session) return
    setLoading(true)
    setError('')
    try {
      const response = await registerLinkyAccount(session.userId, session.accessToken, {
        productCode: product,
        linkyAccount,
      })
      setResult(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.failure)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="consumer-app-page">
      <main className="consumer-shell consumer-form-shell">
        <header className="consumer-topbar">
          <a className="consumer-brand" href="/earnings"><img className="consumer-brand-logo" src="/bandeira-logo-v1.png" alt="" />BANDEIRA</a>
          <div className="consumer-topbar-actions">
            <select className="consumer-language" aria-label={copy.languageLabel} value={locale} onChange={(event) => setLocale(event.target.value as keyof typeof copyByLocale)}>
              <option value="zh">中文</option>
              <option value="en">EN</option>
              <option value="es">ES</option>
              <option value="id">ID</option>
              <option value="pt">PT</option>
            </select>
            {session ? <ConsumerAccountLink locale={locale} /> : null}
          </div>
        </header>

        <section className="consumer-commercial-hero consumer-bind-hero">
          <span className="consumer-visually-hidden">{accountCopy.bindingTitle}</span>
          <div className="consumer-commercial-kicker"><Diamond weight="fill" aria-hidden="true" /> BANDEIRA REWARDS</div>
          <h1>{accountCopy.bindingTitle}</h1>
          <p>{copy.productLabel} · Linky · {accountCopy.bindingSubtitle}</p>
          <div className="consumer-commercial-proof">
            <span><ShieldCheck weight="fill" aria-hidden="true" />{platformBindingProofCopy[locale].ownership}</span>
            <span><LinkSimple weight="bold" aria-hidden="true" />{platformBindingProofCopy[locale].traceable}</span>
          </div>
        </section>

        {error ? (
          <section className="consumer-banner is-error" role="alert">
            <strong>{guildMismatch ? localizedBindingError : copy.failure}</strong>
            {!guildMismatch ? <span>{localizedBindingError}</span> : null}
          </section>
        ) : result ? (
          <section className="consumer-banner is-success" role="status"><strong>{copy.success}</strong><span>{accountCopy.bindingSuccess}</span></section>
        ) : null}

        {session ? (
          <form className="consumer-form-card" onSubmit={handleSubmit}>
            <div className="consumer-form-card-heading"><div><h2>{accountCopy.bindingTitle}</h2><p>{accountCopy.inviteRelationship}</p></div><LinkSimple size={28} weight="duotone" /></div>
            <label className="consumer-field">
              <span>{accountCopy.linkyAccount}</span>
              <input value={linkyAccount} onChange={(event) => setLinkyAccount(event.target.value.replace(/\D/g, '').slice(0, 8))} placeholder={accountCopy.linkyPlaceholder} inputMode="numeric" autoFocus />
            </label>
            <input type="hidden" value={product} readOnly />
            <button className="consumer-form-submit" type="submit" disabled={loading || !canSubmit}>
              {loading ? accountCopy.binding : accountCopy.bind}<ArrowRight weight="bold" aria-hidden="true" />
            </button>
            <p className="consumer-form-note"><ShieldCheck weight="fill" aria-hidden="true" />{accountCopy.bindingSubtitle}</p>
          </form>
        ) : (
          <section className="consumer-auth-gate">
            <div className="consumer-auth-icon"><LockSimple weight="duotone" aria-hidden="true" /></div>
            <h2>{accountCopy.signInTitle}</h2><p>{accountCopy.signInHint}</p>
            <a className="consumer-primary-link" href="/invite#phone-login">{accountCopy.signIn}<ArrowRight weight="bold" aria-hidden="true" /></a>
          </section>
        )}

        {result ? (
          <section className="consumer-result-card">
            <div><CheckCircle weight="fill" aria-hidden="true" /><strong>{copy.resultWritten}</strong></div>
            <dl>
              <div><dt>{accountCopy.linkyAccount}</dt><dd>{result.linkyAccount}</dd></div>
              <div><dt>{copy.status}</dt><dd>{accountCopy.active}</dd></div>
            </dl>
            <a href="/account">{accountCopy.accountShortcut}<ArrowRight weight="bold" aria-hidden="true" /></a>
          </section>
        ) : null}

        {session ? <ConsumerBottomNavigation locale={locale} active="account" /> : null}
      </main>
    </div>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function formatBusinessRewardLevel(rewardLevel?: number | null, locale: string = 'zh') {
  if (locale === 'zh') {
    const labels: Record<number, string> = {
      1: '直接邀请奖励',
      2: '历史二级佣金（只读）',
      3: '历史三级佣金（只读）',
    }
    return labels[rewardLevel ?? 0] ?? `历史层级 ${rewardLevel ?? '-'} 佣金（只读）`
  }
  const labels: Record<number, string> = {
    1: 'Direct invite reward',
    2: 'Legacy level 2 commission (read-only)',
    3: 'Legacy level 3 commission (read-only)',
  }
  return labels[rewardLevel ?? 0] ?? `Legacy level ${rewardLevel ?? '-'} commission (read-only)`
}

const externalPageCopyByLocale = {
  zh: {
    navBind: '绑定页',
    navInvite: '邀请好友',
    navEarnings: '我的收益',
    languageLabel: '语言',
    inviteKicker: 'INVITE CODE ENTRY',
    inviteTitle: '邀请好友',
    inviteSubtitle: '登录后复制邀请码或分享注册链接。',
    productLabel: '产品',
    whatsappLabel: 'WhatsApp 号码',
    appAccountLabel: 'app 账户（8位数字）',
    generateButton: '立即生成邀请码',
    generating: '生成中...',
    myInviteCode: '我的邀请码',
    copyInviteCode: '一键复制邀请码',
    issueSuccess: '邀请码已生成。',
    issueFailure: '生成邀请码失败',
    copySuccess: '邀请码已复制。',
    copyFailure: '复制邀请码失败，请手动复制。',
    earningsKicker: 'EARNINGS ENTRY',
    earningsTitle: '我的收益',
    earningsSubtitle: '查看可用、冻结和累计奖励。',
    boardTitle: '你的收益会在这里持续更新',
    boardSubtitle: '从邀请码、绑定到奖励到账，这一页会持续帮你看清进度。',
    boardBadgeCode: '邀请码固定不变',
    boardBadgeBind: '绑定后自动累计',
    boardBadgeStatus: '到账状态一目了然',
    noSession: '还没有用户会话，请先去“生成我的邀请码”页面生成邀请码。',
    noSessionTitle: '登录后查看你的邀请码',
    noSessionHint: '使用手机号登录后即可邀请好友和查看收益。',
    noSessionPrimary: '手机号登录',
    noSessionSecondary: '去绑定关系',
    inviteeIncome: '被邀请人的收益',
    inviteeIncomeBadge: '已确认',
    myCommission: '你的提成',
    myCommissionBadge: '累计提成',
    availableReward: '可用奖励',
    availableRewardBadge: '可立即查看',
    frozenReward: '冻结奖励',
    riskHoldReward: '风险冻结',
    inviteeIncomeHint: '来自你的下线成员累计确认收益。',
    myCommissionHint: '按奖励记录汇总出来的你的分销提成。',
    availableRewardHint: '当前已经进入可结算状态的奖励。',
    earningsOverview: '我的收益概览',
    overviewCardTitle: '当前邀请码与收益总览',
    overviewBadge: '邀请码 / 团队 / 奖励',
    progressTitle: '当前邀请进度',
    progressCardTitle: '绑定完成后人数和收益会持续更新',
    progressBadge: '进度追踪',
    progressHint: '邀请码固定不变；完成绑定后，邀请人数、有效人数和收益会逐步更新。',
    settlementTitle: '奖励到账说明',
    settlementCardTitle: '冻结中 → 可结算 → 风险冻结',
    settlementBadge: '到账路径',
    settlementHint: '奖励会先进入冻结，满足结算条件后转为可用；如触发风控，会暂时进入风险冻结。',
    nextStepsTitle: '接下来你可以继续做',
    nextInvite: '继续去生成邀请码',
    nextBind: '继续去绑定关系',
    inviteCode: '邀请码',
    invitedUsers: '邀请人数',
    effectiveUsers: '有效人数',
    totalReward: '累计奖励',
    rewardRecords: '收益记录',
    rewardActivityTitle: '最近奖励动态',
    rewardActivityHint: '每一笔奖励都会显示状态和时间，方便你确认什么时候到账。',
    rewardStatusGuideTitle: '状态说明',
    rewardStatusGuideFrozen: '冻结中：奖励正在等待结算',
    rewardStatusGuideAvailable: '可结算：奖励已经可以使用',
    rewardStatusGuideRiskHold: '风险冻结：奖励暂时进入风控复核',
    loading: '加载中...',
    noRewards: '暂时还没有收益记录。',
    emptyRewardsTitle: '还没有收益记录',
    emptyRewardsHint: '先去生成邀请码并完成绑定，后续有收益会自动显示在这里。',
    emptyRewardsAction: '去生成我的邀请码',
    rewardLine: '被邀请人收益层级',
    commissionTail: '你的提成',
    rewardStatusFrozen: '冻结中',
    rewardStatusAvailable: '可结算',
    rewardStatusRiskHold: '风险冻结',
    rewardStatusDefault: '处理中',
  },
  en: {
    navBind: 'Binding page',
    navInvite: 'Generate my invite code',
    navEarnings: 'View my team earnings',
    languageLabel: 'Language',
    inviteKicker: 'INVITE CODE ENTRY',
    inviteTitle: 'Generate my invite code',
    inviteSubtitle: 'Sign in to copy your invite code or share a registration link.',
    productLabel: 'Product',
    whatsappLabel: 'WhatsApp number',
    appAccountLabel: 'App account (8 digits)',
    generateButton: 'Generate invite code',
    generating: 'Generating...',
    myInviteCode: 'My invite code',
    copyInviteCode: 'Copy invite code',
    issueSuccess: 'Invite code generated.',
    issueFailure: 'Failed to generate invite code',
    copySuccess: 'Invite code copied.',
    copyFailure: 'Failed to copy invite code.',
    earningsKicker: 'EARNINGS ENTRY',
    earningsTitle: 'View my team earnings',
    earningsSubtitle: 'See two parts: invitee earnings + your commission.',
    boardTitle: 'Your earnings will keep updating here',
    boardSubtitle: 'From invite code to binding to reward settlement, this page helps you track the whole progress clearly.',
    boardBadgeCode: 'Invite code stays the same',
    boardBadgeBind: 'Accumulates after binding',
    boardBadgeStatus: 'Settlement status at a glance',
    noSession: 'No user session yet. Generate your invite code first.',
    noSessionTitle: 'Generate your invite code first',
    noSessionHint: 'No invites yet, and that is okay. Generate your invite code first, then complete the binding step. Earnings will start to accumulate here automatically.',
    noSessionPrimary: 'Generate my invite code',
    noSessionSecondary: 'Go to binding page',
    inviteeIncome: 'Invitee earnings',
    inviteeIncomeBadge: 'Confirmed',
    myCommission: 'Your commission',
    myCommissionBadge: 'Total commission',
    availableReward: 'Available reward',
    availableRewardBadge: 'Ready to view',
    frozenReward: 'Frozen reward',
    riskHoldReward: 'Risk hold',
    inviteeIncomeHint: 'Confirmed earnings from your downstream members.',
    myCommissionHint: 'Your commission aggregated from reward records.',
    availableRewardHint: 'Rewards already available for settlement.',
    earningsOverview: 'My earnings overview',
    overviewCardTitle: 'Current invite code and reward snapshot',
    overviewBadge: 'Invite code / Team / Rewards',
    progressTitle: 'Current invite progress',
    progressCardTitle: 'After binding, users and rewards will keep updating here',
    progressBadge: 'Progress tracking',
    progressHint: 'Your invite code stays the same. After binding is completed, invited users, effective users, and rewards will update here step by step.',
    settlementTitle: 'How reward settlement works',
    settlementCardTitle: 'Frozen → Available → Risk hold',
    settlementBadge: 'Settlement path',
    settlementHint: 'Rewards usually enter frozen status first, become available after settlement conditions are met, and may move into risk hold if a risk review is triggered.',
    nextStepsTitle: 'What you can do next',
    nextInvite: 'Generate another invite code',
    nextBind: 'Go to binding page',
    inviteCode: 'Invite code',
    invitedUsers: 'Invited users',
    effectiveUsers: 'Effective users',
    totalReward: 'Total reward',
    rewardRecords: 'Reward records',
    rewardActivityTitle: 'Recent reward activity',
    rewardActivityHint: 'Each reward shows its status and time so you can see when it becomes available.',
    rewardStatusGuideTitle: 'Status guide',
    rewardStatusGuideFrozen: 'Frozen: reward is waiting for settlement',
    rewardStatusGuideAvailable: 'Available: reward is ready to use',
    rewardStatusGuideRiskHold: 'Risk hold: reward is under risk review for now',
    loading: 'Loading...',
    noRewards: 'No reward records yet.',
    emptyRewardsTitle: 'No reward records yet',
    emptyRewardsHint: 'Generate an invite code and complete the binding flow first. Once earnings are created, they will show up here automatically.',
    emptyRewardsAction: 'Generate my invite code',
    rewardLine: 'Invitee reward level',
    commissionTail: 'your commission',
    rewardStatusFrozen: 'Frozen',
    rewardStatusAvailable: 'Available',
    rewardStatusRiskHold: 'Risk hold',
    rewardStatusDefault: 'Processing',
  },
  es: {
    navBind: 'Página de vínculo',
    navInvite: 'Generar mi código',
    navEarnings: 'Ver ganancias de mi equipo',
    languageLabel: 'Idioma',
    inviteKicker: 'INVITE CODE ENTRY',
    inviteTitle: 'Generar mi código',
    inviteSubtitle: 'Inicia sesión para copiar tu código o compartir un enlace de registro.',
    productLabel: 'Producto',
    whatsappLabel: 'Número de WhatsApp',
    appAccountLabel: 'Cuenta app (8 dígitos)',
    generateButton: 'Generar código',
    generating: 'Generando...',
    myInviteCode: 'Mi código',
    copyInviteCode: 'Copiar código',
    issueSuccess: 'Código generado.',
    issueFailure: 'Error al generar el código',
    copySuccess: 'Código copiado.',
    copyFailure: 'Error al copiar el código.',
    earningsKicker: 'EARNINGS ENTRY',
    earningsTitle: 'Ver ganancias de mi equipo',
    earningsSubtitle: 'Mira dos partes: ganancias del invitado + tu comisión.',
    boardTitle: 'Tus ganancias se actualizarán aquí continuamente',
    boardSubtitle: 'Desde el código de invitación hasta el vínculo y la liquidación, esta página te ayuda a seguir todo el progreso con claridad.',
    boardBadgeCode: 'El código no cambia',
    boardBadgeBind: 'Se acumula después del vínculo',
    boardBadgeStatus: 'Estado visible de un vistazo',
    noSession: 'Todavía no hay sesión. Genera tu código primero.',
    noSessionTitle: 'Primero genera tu código',
    noSessionHint: 'Si todavía no empezaste a invitar, no pasa nada. Genera tu código primero y luego completa el vínculo. Las ganancias se acumularán aquí automáticamente.',
    noSessionPrimary: 'Generar mi código',
    noSessionSecondary: 'Ir a la página de vínculo',
    inviteeIncome: 'Ganancias del invitado',
    inviteeIncomeBadge: 'Confirmadas',
    myCommission: 'Tu comisión',
    myCommissionBadge: 'Comisión acumulada',
    availableReward: 'Recompensa disponible',
    availableRewardBadge: 'Lista para ver',
    frozenReward: 'Recompensa congelada',
    riskHoldReward: 'Retención por riesgo',
    inviteeIncomeHint: 'Ganancias confirmadas de tus miembros referidos.',
    myCommissionHint: 'Tu comisión agregada desde los registros.',
    availableRewardHint: 'Recompensas ya disponibles para liquidación.',
    earningsOverview: 'Resumen de mis ganancias',
    overviewCardTitle: 'Código actual y resumen de ganancias',
    overviewBadge: 'Código / Equipo / Recompensas',
    progressTitle: 'Progreso actual de invitación',
    progressCardTitle: 'Después del vínculo, usuarios y recompensas seguirán actualizándose aquí',
    progressBadge: 'Seguimiento',
    progressHint: 'Tu código no cambia. Después del vínculo, invitados, usuarios efectivos y recompensas se actualizarán aquí paso a paso.',
    settlementTitle: 'Cómo se acredita la recompensa',
    settlementCardTitle: 'Congelada → Disponible → Retención por riesgo',
    settlementBadge: 'Ruta de acreditación',
    settlementHint: 'La recompensa primero pasa por congelación, luego se vuelve disponible al cumplir las condiciones y puede entrar en retención por riesgo si se activa una revisión.',
    nextStepsTitle: 'Qué puedes hacer ahora',
    nextInvite: 'Seguir para generar mi código',
    nextBind: 'Seguir para vincular relación',
    inviteCode: 'Código',
    invitedUsers: 'Invitados',
    effectiveUsers: 'Usuarios efectivos',
    totalReward: 'Recompensa total',
    rewardRecords: 'Registros de recompensa',
    rewardActivityTitle: 'Actividad reciente de recompensas',
    rewardActivityHint: 'Cada recompensa muestra su estado y hora para que puedas confirmar cuándo se acredita.',
    rewardStatusGuideTitle: 'Guía de estados',
    rewardStatusGuideFrozen: 'Congelada: la recompensa está esperando liquidación',
    rewardStatusGuideAvailable: 'Disponible: la recompensa ya se puede usar',
    rewardStatusGuideRiskHold: 'Retención por riesgo: la recompensa está en revisión temporal',
    loading: 'Cargando...',
    noRewards: 'Todavía no hay registros.',
    emptyRewardsTitle: 'Todavía no hay registros',
    emptyRewardsHint: 'Primero genera tu código y completa el vínculo. Cuando aparezcan ganancias, se verán aquí automáticamente.',
    emptyRewardsAction: 'Generar mi código',
    rewardLine: 'Nivel de recompensa del invitado',
    commissionTail: 'tu comisión',
    rewardStatusFrozen: 'Congelada',
    rewardStatusAvailable: 'Disponible',
    rewardStatusRiskHold: 'Retención por riesgo',
    rewardStatusDefault: 'En proceso',
  },
  id: {
    navBind: 'Halaman bind',
    navInvite: 'Buat kode undangan saya',
    navEarnings: 'Lihat penghasilan tim saya',
    languageLabel: 'Bahasa',
    inviteKicker: 'INVITE CODE ENTRY',
    inviteTitle: 'Buat kode undangan saya',
    inviteSubtitle: 'Masuk untuk menyalin kode undangan atau membagikan tautan pendaftaran.',
    productLabel: 'Produk',
    whatsappLabel: 'Nomor WhatsApp',
    appAccountLabel: 'Akun app (8 digit)',
    generateButton: 'Buat kode undangan',
    generating: 'Membuat...',
    myInviteCode: 'Kode undangan saya',
    copyInviteCode: 'Salin kode undangan',
    issueSuccess: 'Kode undangan berhasil dibuat.',
    issueFailure: 'Gagal membuat kode undangan',
    copySuccess: 'Kode undangan disalin.',
    copyFailure: 'Gagal menyalin kode undangan.',
    earningsKicker: 'EARNINGS ENTRY',
    earningsTitle: 'Lihat penghasilan tim saya',
    earningsSubtitle: 'Lihat dua bagian: penghasilan bawahan + komisi kamu.',
    boardTitle: 'Penghasilan kamu akan terus diperbarui di sini',
    boardSubtitle: 'Dari kode undangan, bind, sampai reward masuk, halaman ini membantu kamu melihat progresnya dengan jelas.',
    boardBadgeCode: 'Kode undangan tetap sama',
    boardBadgeBind: 'Otomatis akumulasi setelah bind',
    boardBadgeStatus: 'Status reward langsung kelihatan',
    noSession: 'Belum ada sesi pengguna. Buat kode undangan dulu.',
    noSessionTitle: 'Buat kode undangan dulu',
    noSessionHint: 'Kalau belum mulai mengundang juga tidak masalah. Buat kode undangan dulu, lalu selesaikan bind. Penghasilan akan otomatis terkumpul di sini.',
    noSessionPrimary: 'Buat kode undangan saya',
    noSessionSecondary: 'Ke halaman bind',
    inviteeIncome: 'Penghasilan bawahan',
    inviteeIncomeBadge: 'Terkonfirmasi',
    myCommission: 'Komisi kamu',
    myCommissionBadge: 'Komisi terkumpul',
    availableReward: 'Reward tersedia',
    availableRewardBadge: 'Siap dilihat',
    frozenReward: 'Reward dibekukan',
    riskHoldReward: 'Tertahan risiko',
    inviteeIncomeHint: 'Akumulasi penghasilan terkonfirmasi dari tim kamu.',
    myCommissionHint: 'Komisi kamu yang dihitung dari catatan reward.',
    availableRewardHint: 'Reward yang sudah bisa diproses.',
    earningsOverview: 'Ringkasan penghasilan saya',
    overviewCardTitle: 'Kode undangan saat ini dan ringkasan reward',
    overviewBadge: 'Kode / Tim / Reward',
    progressTitle: 'Progres undangan saat ini',
    progressCardTitle: 'Setelah bind selesai, pengguna dan reward akan terus diperbarui di sini',
    progressBadge: 'Lacak progres',
    progressHint: 'Kode undangan kamu tetap sama. Setelah bind selesai, jumlah undangan, pengguna efektif, dan reward akan diperbarui bertahap di sini.',
    settlementTitle: 'Cara reward masuk',
    settlementCardTitle: 'Dibekukan → Tersedia → Tertahan risiko',
    settlementBadge: 'Alur reward',
    settlementHint: 'Reward biasanya masuk ke status beku dulu, lalu menjadi tersedia setelah syarat terpenuhi, dan bisa masuk ke penahanan risiko bila ada review risiko.',
    nextStepsTitle: 'Langkah berikutnya',
    nextInvite: 'Lanjut buat kode undangan',
    nextBind: 'Lanjut ke halaman bind',
    inviteCode: 'Kode undangan',
    invitedUsers: 'Jumlah undangan',
    effectiveUsers: 'Pengguna efektif',
    totalReward: 'Total reward',
    rewardRecords: 'Catatan reward',
    rewardActivityTitle: 'Aktivitas reward terbaru',
    rewardActivityHint: 'Setiap reward menampilkan status dan waktunya supaya kamu tahu kapan reward masuk.',
    rewardStatusGuideTitle: 'Penjelasan status',
    rewardStatusGuideFrozen: 'Dibekukan: reward masih menunggu settlement',
    rewardStatusGuideAvailable: 'Tersedia: reward sudah bisa dipakai',
    rewardStatusGuideRiskHold: 'Tertahan risiko: reward sedang masuk review risiko',
    loading: 'Memuat...',
    noRewards: 'Belum ada catatan reward.',
    emptyRewardsTitle: 'Belum ada catatan reward',
    emptyRewardsHint: 'Buat kode undangan dan selesaikan bind dulu. Setelah ada penghasilan, catatannya akan otomatis muncul di sini.',
    emptyRewardsAction: 'Buat kode undangan saya',
    rewardLine: 'Level reward bawahan',
    commissionTail: 'komisi kamu',
    rewardStatusFrozen: 'Dibekukan',
    rewardStatusAvailable: 'Tersedia',
    rewardStatusRiskHold: 'Tertahan risiko',
    rewardStatusDefault: 'Diproses',
  },
  pt: {
    navBind: 'Página de vínculo',
    navInvite: 'Gerar meu código',
    navEarnings: 'Ver ganhos da minha equipe',
    languageLabel: 'Idioma',
    inviteKicker: 'INVITE CODE ENTRY',
    inviteTitle: 'Gerar meu código',
    inviteSubtitle: 'Entre para copiar seu código ou compartilhar um link de cadastro.',
    productLabel: 'Produto',
    whatsappLabel: 'Número do WhatsApp',
    appAccountLabel: 'Conta do app (8 dígitos)',
    generateButton: 'Gerar código de convite',
    generating: 'Gerando...',
    myInviteCode: 'Meu código',
    copyInviteCode: 'Copiar código',
    issueSuccess: 'Código gerado.',
    issueFailure: 'Falha ao gerar o código',
    copySuccess: 'Código copiado.',
    copyFailure: 'Falha ao copiar o código.',
    earningsKicker: 'EARNINGS ENTRY',
    earningsTitle: 'Ver ganhos da minha equipe',
    earningsSubtitle: 'Veja duas partes: ganhos do convidado + sua comissão.',
    boardTitle: 'Seus ganhos vão continuar sendo atualizados aqui',
    boardSubtitle: 'Do código de convite ao vínculo e à liquidação, esta página ajuda você a acompanhar todo o progresso com clareza.',
    boardBadgeCode: 'O código não muda',
    boardBadgeBind: 'Acumula depois do vínculo',
    boardBadgeStatus: 'Status visível de imediato',
    noSession: 'Ainda não há sessão. Gere seu código primeiro.',
    noSessionTitle: 'Gere seu código primeiro',
    noSessionHint: 'Se você ainda não começou a convidar, tudo bem. Gere seu código primeiro e depois conclua o vínculo. Os ganhos vão começar a aparecer aqui automaticamente.',
    noSessionPrimary: 'Gerar meu código',
    noSessionSecondary: 'Ir para a página de vínculo',
    inviteeIncome: 'Ganhos dos convidados',
    inviteeIncomeBadge: 'Confirmados',
    myCommission: 'Sua comissão',
    myCommissionBadge: 'Comissão acumulada',
    availableReward: 'Recompensa disponível',
    availableRewardBadge: 'Pronta para ver',
    frozenReward: 'Recompensa congelada',
    riskHoldReward: 'Bloqueio de risco',
    inviteeIncomeHint: 'Ganhos confirmados dos membros da sua equipe.',
    myCommissionHint: 'Sua comissão somada a partir dos registros.',
    availableRewardHint: 'Recompensas já disponíveis para liquidação.',
    earningsOverview: 'Resumo dos meus ganhos',
    overviewCardTitle: 'Código atual e visão geral das recompensas',
    overviewBadge: 'Código / Equipe / Recompensas',
    progressTitle: 'Progresso atual dos convites',
    progressCardTitle: 'Depois do vínculo, usuários e recompensas continuarão sendo atualizados aqui',
    progressBadge: 'Acompanhar progresso',
    progressHint: 'Seu código de convite não muda. Depois do vínculo, convidados, usuários efetivos e recompensas serão atualizados aqui aos poucos.',
    settlementTitle: 'Como a recompensa entra',
    settlementCardTitle: 'Congelada → Disponível → Bloqueio de risco',
    settlementBadge: 'Caminho da recompensa',
    settlementHint: 'A recompensa normalmente entra primeiro como congelada, vira disponível após cumprir as condições e pode ir para bloqueio de risco se houver revisão.',
    nextStepsTitle: 'Próximos passos',
    nextInvite: 'Continuar para gerar meu código',
    nextBind: 'Continuar para vincular relação',
    inviteCode: 'Código de convite',
    invitedUsers: 'Convidados',
    effectiveUsers: 'Usuários efetivos',
    totalReward: 'Recompensa total',
    rewardRecords: 'Registros de recompensa',
    rewardActivityTitle: 'Atividade recente de recompensas',
    rewardActivityHint: 'Cada recompensa mostra o status e o horário para você acompanhar quando ela entra.',
    rewardStatusGuideTitle: 'Guia de status',
    rewardStatusGuideFrozen: 'Congelada: a recompensa está aguardando liquidação',
    rewardStatusGuideAvailable: 'Disponível: a recompensa já pode ser usada',
    rewardStatusGuideRiskHold: 'Bloqueio de risco: a recompensa está em revisão temporária',
    loading: 'Carregando...',
    noRewards: 'Ainda não há registros.',
    emptyRewardsTitle: 'Ainda não há registros',
    emptyRewardsHint: 'Gere seu código e conclua o vínculo primeiro. Quando houver ganhos, eles aparecerão aqui automaticamente.',
    emptyRewardsAction: 'Gerar meu código',
    rewardLine: 'Nível de recompensa do convidado',
    commissionTail: 'sua comissão',
    rewardStatusFrozen: 'Congelada',
    rewardStatusAvailable: 'Disponível',
    rewardStatusRiskHold: 'Bloqueio de risco',
    rewardStatusDefault: 'Em processamento',
  },
} as const

const timoBindingCopy: Record<ConsumerLocale, {
  title: string; subtitle: string; summary: string; open: string; account: string; hint: string; placeholder: string
  submit: string; verifying: string; verifyAgain: string; verified: string; submitted: string; pending: string; rejected: string
  signInTitle: string; signInHint: string; signIn: string; failure: string
}> = {
  zh: { title: '绑定 Timo 账号', subtitle: '填写官方 Timo ID，核验归属后进入影子奖励计算。', summary: '使用官方 12 位 Timo ID 完成归属核验。', open: '绑定 Timo 账号', account: 'Timo ID（12 位数字）', hint: '请填写官方定义的 12 位、首位非 0 的数字 Timo ID；不能使用昵称、WhatsApp 或邀请码。', placeholder: '例如 123456789012', submit: '提交并核验 Timo ID', verifying: '核验中…', verifyAgain: '重新核验', verified: 'Timo 账号已完成核验。', submitted: 'Timo ID 已提交，等待核验。', pending: '账号已提交；当前核验尚未完成，请稍后重试。', rejected: '核验未通过', signInTitle: '登录后绑定 Timo 账号', signInHint: '请先使用手机号登录，再绑定官方 Timo ID。', signIn: '去手机号登录', failure: 'Timo 绑定失败' },
  en: { title: 'Bind Timo account', subtitle: 'Enter the official Timo ID and verify account ownership before shadow reward calculation.', summary: 'Use the official 12-digit Timo ID for ownership verification.', open: 'Bind Timo account', account: 'Timo ID (12 digits)', hint: 'Enter the official 12-digit numeric Timo ID that does not start with 0. Do not use a nickname, WhatsApp number, or invite code.', placeholder: 'e.g. 123456789012', submit: 'Submit and verify Timo ID', verifying: 'Verifying…', verifyAgain: 'Verify again', verified: 'Your Timo account has been verified.', submitted: 'Your Timo ID was submitted and is awaiting verification.', pending: 'The ID was submitted; verification has not completed yet. Try again later.', rejected: 'Verification was not approved', signInTitle: 'Sign in to bind Timo', signInHint: 'Sign in with your phone before binding the official Timo ID.', signIn: 'Sign in with phone', failure: 'Timo binding failed' },
  es: { title: 'Vincular cuenta Timo', subtitle: 'Ingresa el ID oficial de Timo y verifica la titularidad antes del cálculo de recompensas en sombra.', summary: 'Usa el ID oficial de Timo de 12 dígitos para verificar la titularidad.', open: 'Vincular cuenta Timo', account: 'ID de Timo (12 dígitos)', hint: 'Ingresa el ID oficial numérico de Timo de 12 dígitos que no empieza en 0. No uses apodo, WhatsApp ni código de invitación.', placeholder: 'ej. 123456789012', submit: 'Enviar y verificar ID de Timo', verifying: 'Verificando…', verifyAgain: 'Verificar de nuevo', verified: 'Tu cuenta Timo fue verificada.', submitted: 'Tu ID de Timo fue enviado y espera verificación.', pending: 'El ID fue enviado; la verificación aún no termina. Inténtalo después.', rejected: 'La verificación no fue aprobada', signInTitle: 'Inicia sesión para vincular Timo', signInHint: 'Inicia sesión con tu teléfono antes de vincular el ID oficial de Timo.', signIn: 'Iniciar sesión', failure: 'Error al vincular Timo' },
  id: { title: 'Hubungkan akun Timo', subtitle: 'Masukkan ID Timo resmi dan verifikasi kepemilikan sebelum perhitungan reward bayangan.', summary: 'Gunakan ID Timo resmi 12 digit untuk verifikasi kepemilikan.', open: 'Hubungkan akun Timo', account: 'ID Timo (12 digit)', hint: 'Masukkan ID Timo resmi 12 digit yang tidak diawali 0. Jangan gunakan nama panggilan, WhatsApp, atau kode undangan.', placeholder: 'contoh 123456789012', submit: 'Kirim dan verifikasi ID Timo', verifying: 'Memverifikasi…', verifyAgain: 'Verifikasi lagi', verified: 'Akun Timo kamu sudah diverifikasi.', submitted: 'ID Timo kamu sudah dikirim dan menunggu verifikasi.', pending: 'ID sudah dikirim; verifikasi belum selesai. Coba lagi nanti.', rejected: 'Verifikasi tidak disetujui', signInTitle: 'Masuk untuk menghubungkan Timo', signInHint: 'Masuk dengan ponsel sebelum menghubungkan ID Timo resmi.', signIn: 'Masuk dengan ponsel', failure: 'Gagal menghubungkan Timo' },
  pt: { title: 'Vincular conta Timo', subtitle: 'Informe o ID oficial do Timo e valide a titularidade antes do cálculo de recompensas em modo sombra.', summary: 'Use o ID oficial do Timo com 12 dígitos para validar a titularidade.', open: 'Vincular conta Timo', account: 'ID Timo (12 dígitos)', hint: 'Informe o ID numérico oficial do Timo com 12 dígitos e sem começar por 0. Não use apelido, WhatsApp ou código de convite.', placeholder: 'ex. 123456789012', submit: 'Enviar e validar ID Timo', verifying: 'Validando…', verifyAgain: 'Validar novamente', verified: 'Sua conta Timo foi validada.', submitted: 'Seu ID Timo foi enviado e aguarda validação.', pending: 'O ID foi enviado; a validação ainda não terminou. Tente mais tarde.', rejected: 'A validação não foi aprovada', signInTitle: 'Entre para vincular o Timo', signInHint: 'Entre com o telefone antes de vincular o ID oficial do Timo.', signIn: 'Entrar com telefone', failure: 'Falha ao vincular Timo' },
}

const timoBindingErrorCopy: Record<ConsumerLocale, { country: string; targetGuild: string; duplicate: string; notInGuild: string; joinWindow: string; joinedAtMissing: string; unavailable: string; generic: string }> = {
  zh: { country: '当前登记国家尚未配置 Timo 公会核验，请联系运营人员。', targetGuild: '目标 Timo 公会未配置或与权威记录不符。', duplicate: '这个 Timo ID 已被登记，不能重复绑定。', notInGuild: '这个 Timo ID 不属于目标公会。', joinWindow: '公会加入时间与绑定提交时间不符合核验要求。', joinedAtMissing: 'MCN 暂未提供可核验的公会加入时间。', unavailable: 'Timo 核验暂时不可用，请稍后重试。', generic: 'Timo 核验未完成，请稍后重试或联系运营人员。' },
  en: { country: 'Timo guild verification is not configured for your registered country. Please contact support.', targetGuild: 'The expected Timo guild is not configured or does not match the official record.', duplicate: 'This Timo ID is already registered and cannot be bound again.', notInGuild: 'This Timo ID is not in the expected guild.', joinWindow: 'The guild join date does not meet the binding verification window.', joinedAtMissing: 'MCN has not provided a verifiable guild join date.', unavailable: 'Timo verification is temporarily unavailable. Try again later.', generic: 'Timo verification could not be completed. Try again later or contact support.' },
  es: { country: 'La verificación del gremio Timo no está configurada para tu país de registro. Contacta al equipo de soporte.', targetGuild: 'El gremio Timo esperado no está configurado o no coincide con el registro oficial.', duplicate: 'Este ID de Timo ya está registrado y no puede vincularse otra vez.', notInGuild: 'Este ID de Timo no pertenece al gremio esperado.', joinWindow: 'La fecha de ingreso al gremio no cumple el plazo de verificación.', joinedAtMissing: 'MCN no ha proporcionado una fecha de ingreso verificable.', unavailable: 'La verificación de Timo no está disponible por ahora. Inténtalo más tarde.', generic: 'No se pudo completar la verificación de Timo. Inténtalo más tarde o contacta al equipo de soporte.' },
  id: { country: 'Verifikasi guild Timo belum tersedia untuk negara pendaftaranmu. Hubungi tim dukungan.', targetGuild: 'Guild Timo tujuan belum dikonfigurasi atau tidak cocok dengan data resmi.', duplicate: 'ID Timo ini sudah terdaftar dan tidak dapat dihubungkan lagi.', notInGuild: 'ID Timo ini tidak berada di guild tujuan.', joinWindow: 'Tanggal bergabung dengan guild tidak memenuhi batas waktu verifikasi.', joinedAtMissing: 'MCN belum menyediakan tanggal bergabung dengan guild yang dapat diverifikasi.', unavailable: 'Verifikasi Timo sementara tidak tersedia. Coba lagi nanti.', generic: 'Verifikasi Timo belum selesai. Coba lagi nanti atau hubungi tim dukungan.' },
  pt: { country: 'A verificação da guilda Timo não está configurada para o seu país de cadastro. Entre em contato com o suporte.', targetGuild: 'A guilda Timo esperada não está configurada ou não corresponde ao registro oficial.', duplicate: 'Este ID Timo já está cadastrado e não pode ser vinculado novamente.', notInGuild: 'Este ID Timo não pertence à guilda esperada.', joinWindow: 'A data de entrada na guilda não atende ao prazo de verificação.', joinedAtMissing: 'O MCN ainda não forneceu uma data de entrada na guilda que possa ser verificada.', unavailable: 'A verificação do Timo está temporariamente indisponível. Tente novamente mais tarde.', generic: 'Não foi possível concluir a verificação do Timo. Tente novamente mais tarde ou entre em contato com o suporte.' },
}

// eslint-disable-next-line react-refresh/only-export-components
export function localizeTimoBindingError(message: string, locale: ConsumerLocale) {
  const normalized = message.toLowerCase()
  const copy = timoBindingErrorCopy[locale]
  if (normalized.includes('no mcn timo country mapping') || normalized.includes('no enabled timo target guild')) return copy.country
  if (normalized.includes('expected_guild_mismatch')) return copy.targetGuild
  if (normalized.includes('already has a binding') || normalized.includes('already been recorded')) return copy.duplicate
  if (normalized.includes('not_in_target_guild') || normalized.includes('not in the target guild')) return copy.notInGuild
  if (normalized.includes('join_time_window_exceeded') || normalized.includes('join time is more than 24 hours')) return copy.joinWindow
  if (normalized.includes('formal_join_time_missing')) return copy.joinedAtMissing
  if (normalized.includes('temporarily disabled') || normalized.includes('temporarily unavailable') || normalized.includes('not configured')) return copy.unavailable
  return copy.generic
}

const platformBindingProofCopy: Record<ConsumerLocale, { ownership: string; traceable: string }> = {
  zh: { ownership: '归属核验', traceable: '记录可追踪' },
  en: { ownership: 'Ownership verification', traceable: 'Traceable record' },
  es: { ownership: 'Verificación de titularidad', traceable: 'Registro rastreable' },
  id: { ownership: 'Verifikasi kepemilikan', traceable: 'Catatan dapat dilacak' },
  pt: { ownership: 'Verificação de titularidade', traceable: 'Registro rastreável' },
}

const timoHelpCopy: Record<ConsumerLocale, { findId: string; waiting: string; technical: string; manual: string }> = {
  zh: { findId: '获取 Timo ID：打开 Timo APP → 打开「我」的页面 → 复制 12 位数字 ID。', waiting: '正在等待最新的公会记录，尚未得出核验结果。', technical: '核验服务暂时无法返回结果，系统会自动重试；这并不表示您的账号不合格。', manual: '自动核验未能完成，已转人工处理；请联系运营人员，无需反复提交。' },
  en: { findId: 'Find your Timo ID: open the Timo app → Me → copy the 12-digit ID.', waiting: 'Waiting for the latest guild record. No verification decision yet.', technical: 'The verification service is temporarily unavailable. The system will retry automatically; your account has not been rejected.', manual: 'Automatic verification could not finish. Please contact support for manual review; do not submit repeatedly.' },
  es: { findId: 'Busca tu ID de Timo: abre Timo → Yo → copia el ID de 12 dígitos.', waiting: 'Esperando el registro más reciente del gremio; aún no hay resultado.', technical: 'El servicio de verificación no está disponible. El sistema reintentará automáticamente; tu cuenta no ha sido rechazada.', manual: 'La verificación automática no terminó. Contacta al equipo para una revisión manual; no envíes varias veces.' },
  id: { findId: 'Temukan ID Timo: buka aplikasi Timo → Saya → salin ID 12 digit.', waiting: 'Menunggu data guild terbaru; belum ada keputusan verifikasi.', technical: 'Layanan verifikasi sementara tidak dapat memberi hasil. Sistem akan mencoba lagi; akun Anda belum ditolak.', manual: 'Verifikasi otomatis belum selesai. Hubungi tim dukungan untuk pemeriksaan manual; jangan kirim berulang kali.' },
  pt: { findId: 'Encontre seu ID Timo: abra o aplicativo Timo → Eu → copie o ID de 12 dígitos.', waiting: 'Aguardando o registro mais recente da guilda; ainda não há resultado.', technical: 'O serviço de verificação está indisponível. O sistema tentará novamente; sua conta não foi rejeitada.', manual: 'A verificação automática não terminou. Contate o suporte para revisão manual; não envie várias vezes.' },
}

function timoPendingState(binding: PlatformBindingResponse, locale: ConsumerLocale): string {
  if (binding.verificationState === 'MANUAL_REVIEW_REQUIRED') return timoHelpCopy[locale].manual
  if (binding.verificationState === 'ERROR') return timoHelpCopy[locale].technical
  if (binding.verificationState === 'SOURCE_STALE') return timoHelpCopy[locale].waiting
  return timoBindingCopy[locale].submitted
}

const invitePageCopyByLocale = {
  zh: {
    shareTitle: 'BANDEIRA 邀请',
    shareText: (inviteCode: string) => `使用邀请码 ${inviteCode} 注册并加入 BANDEIRA 奖励计划`,
    shareCopied: '邀请链接已复制。',
    shareFailure: '分享失败，请稍后重试。',
    phoneCodeHint: (verificationCode: string | undefined, ttlMinutes: number) => verificationCode
      ? `测试验证码 ${verificationCode}，${ttlMinutes} 分钟内有效。`
      : `验证码已发送，${ttlMinutes} 分钟内有效。`,
    phoneCodeSent: '验证码已发送。',
    phoneCodeFailure: '获取验证码失败',
    loginFailure: '手机号登录失败',
    errorTitle: '操作失败',
    inviteBenefit: '专属邀请权益',
    myInviteCode: '我的邀请码',
    inviteProgressHint: '好友完成绑定后，邀请进度会自动更新。',
    shareInviteLink: '分享邀请链接',
    loginTitle: '手机号登录',
    loginHint: '使用验证码登录；首次使用时需填写邀请码。',
    phoneLabel: '手机号 / WhatsApp',
    countryCallingCodeLabel: '国家 / 区号',
    phonePlaceholder: '输入本地号码',
    phoneInputHint: '选择国家后，只需输入本地号码。',
    verificationCodeLabel: '验证码',
    verificationCodePlaceholder: '6 位验证码',
    requestVerificationCode: '获取验证码',
    resendCountdown: (seconds: number) => `${seconds} 秒后重新获取`,
    inviteCodeRequiredLabel: '邀请码（首次注册必填）',
    inviteCodePlaceholder: '新用户请输入有效邀请码',
    signInWithPhone: '手机号登录',
    currentAccount: '当前账户',
    userAccount: (userId: number, countryCode: string) => `用户 ${userId} · ${countryCode}`,
    goToBinding: '去绑定',
    navigationLabel: '主要导航',
  },
  en: {
    shareTitle: 'BANDEIRA invitation',
    shareText: (inviteCode: string) => `Use invite code ${inviteCode} to register for the BANDEIRA rewards program`,
    shareCopied: 'Invite link copied.',
    shareFailure: 'Sharing failed. Please try again.',
    phoneCodeHint: (_verificationCode: string | undefined, ttlMinutes: number) => `Verification code sent. It is valid for ${ttlMinutes} minutes.`,
    phoneCodeSent: 'Verification code sent.',
    phoneCodeFailure: 'Could not send verification code',
    loginFailure: 'Phone sign-in failed',
    errorTitle: 'Something went wrong',
    inviteBenefit: 'Your invitation benefits',
    myInviteCode: 'My invite code',
    inviteProgressHint: 'Your invitation progress updates automatically after a friend completes binding.',
    shareInviteLink: 'Share invite link',
    loginTitle: 'Sign in with phone',
    loginHint: 'Use a verification code to sign in. An invite code is required on first use.',
    phoneLabel: 'Phone / WhatsApp',
    countryCallingCodeLabel: 'Country / calling code',
    phonePlaceholder: 'Enter local number',
    phoneInputHint: 'Choose a country, then enter your local number only.',
    verificationCodeLabel: 'Verification code',
    verificationCodePlaceholder: '6-digit code',
    requestVerificationCode: 'Get code',
    resendCountdown: (seconds: number) => `Try again in ${seconds}s`,
    inviteCodeRequiredLabel: 'Invite code (required for first registration)',
    inviteCodePlaceholder: 'Enter a valid invite code',
    signInWithPhone: 'Sign in with phone',
    currentAccount: 'Current account',
    userAccount: (userId: number, countryCode: string) => `User ${userId} · ${countryCode}`,
    goToBinding: 'Go to binding',
    navigationLabel: 'Main navigation',
  },
  es: {
    shareTitle: 'Invitación BANDEIRA',
    shareText: (inviteCode: string) => `Usa el código ${inviteCode} para registrarte en el programa de recompensas BANDEIRA`,
    shareCopied: 'Enlace de invitación copiado.',
    shareFailure: 'No se pudo compartir. Inténtalo de nuevo.',
    phoneCodeHint: (_verificationCode: string | undefined, ttlMinutes: number) => `Código enviado. Válido durante ${ttlMinutes} minutos.`,
    phoneCodeSent: 'Código enviado.',
    phoneCodeFailure: 'No se pudo enviar el código',
    loginFailure: 'Error al iniciar sesión con teléfono',
    errorTitle: 'Ocurrió un error',
    inviteBenefit: 'Tus beneficios de invitación',
    myInviteCode: 'Mi código de invitación',
    inviteProgressHint: 'Tu progreso se actualizará al completar un amigo el vínculo.',
    shareInviteLink: 'Compartir enlace',
    loginTitle: 'Inicia sesión con teléfono',
    loginHint: 'Usa un código de verificación. En el primer acceso se requiere un código de invitación.',
    phoneLabel: 'Teléfono / WhatsApp',
    countryCallingCodeLabel: 'País / prefijo',
    phonePlaceholder: 'Ingresa el número local',
    phoneInputHint: 'Elige un país e ingresa solo tu número local.',
    verificationCodeLabel: 'Código de verificación',
    verificationCodePlaceholder: 'Código de 6 dígitos',
    requestVerificationCode: 'Obtener código',
    resendCountdown: (seconds: number) => `Reintentar en ${seconds}s`,
    inviteCodeRequiredLabel: 'Código de invitación (obligatorio al registrarte)',
    inviteCodePlaceholder: 'Ingresa un código válido',
    signInWithPhone: 'Iniciar sesión',
    currentAccount: 'Cuenta actual',
    userAccount: (userId: number, countryCode: string) => `Usuario ${userId} · ${countryCode}`,
    goToBinding: 'Ir al vínculo',
    navigationLabel: 'Navegación principal',
  },
  id: {
    shareTitle: 'Undangan BANDEIRA',
    shareText: (inviteCode: string) => `Gunakan kode undangan ${inviteCode} untuk mendaftar ke program reward BANDEIRA`,
    shareCopied: 'Tautan undangan disalin.',
    shareFailure: 'Gagal membagikan. Coba lagi nanti.',
    phoneCodeHint: (_verificationCode: string | undefined, ttlMinutes: number) => `Kode verifikasi terkirim dan berlaku ${ttlMinutes} menit.`,
    phoneCodeSent: 'Kode verifikasi terkirim.',
    phoneCodeFailure: 'Gagal mengirim kode verifikasi',
    loginFailure: 'Gagal masuk dengan nomor telepon',
    errorTitle: 'Terjadi kesalahan',
    inviteBenefit: 'Keuntungan undanganmu',
    myInviteCode: 'Kode undangan saya',
    inviteProgressHint: 'Progres undangan akan diperbarui setelah teman menyelesaikan bind.',
    shareInviteLink: 'Bagikan tautan undangan',
    loginTitle: 'Masuk dengan telepon',
    loginHint: 'Masuk dengan kode verifikasi. Kode undangan diperlukan saat pertama kali menggunakan aplikasi.',
    phoneLabel: 'Telepon / WhatsApp',
    countryCallingCodeLabel: 'Negara / kode panggilan',
    phonePlaceholder: 'Masukkan nomor lokal',
    phoneInputHint: 'Pilih negara, lalu masukkan nomor lokal saja.',
    verificationCodeLabel: 'Kode verifikasi',
    verificationCodePlaceholder: 'Kode 6 digit',
    requestVerificationCode: 'Dapatkan kode',
    resendCountdown: (seconds: number) => `Coba lagi dalam ${seconds} dtk`,
    inviteCodeRequiredLabel: 'Kode undangan (wajib saat pendaftaran pertama)',
    inviteCodePlaceholder: 'Masukkan kode undangan yang valid',
    signInWithPhone: 'Masuk dengan telepon',
    currentAccount: 'Akun saat ini',
    userAccount: (userId: number, countryCode: string) => `Pengguna ${userId} · ${countryCode}`,
    goToBinding: 'Ke halaman bind',
    navigationLabel: 'Navigasi utama',
  },
  pt: {
    shareTitle: 'Convite BANDEIRA',
    shareText: (inviteCode: string) => `Use o código ${inviteCode} para se cadastrar no programa de recompensas BANDEIRA`,
    shareCopied: 'Link de convite copiado.',
    shareFailure: 'Não foi possível compartilhar. Tente novamente.',
    phoneCodeHint: (_verificationCode: string | undefined, ttlMinutes: number) => `Código enviado. Ele é válido por ${ttlMinutes} minutos.`,
    phoneCodeSent: 'Código enviado.',
    phoneCodeFailure: 'Não foi possível enviar o código',
    loginFailure: 'Falha no login por telefone',
    errorTitle: 'Algo deu errado',
    inviteBenefit: 'Seus benefícios de convite',
    myInviteCode: 'Meu código de convite',
    inviteProgressHint: 'O progresso será atualizado quando um amigo concluir o vínculo.',
    shareInviteLink: 'Compartilhar link',
    loginTitle: 'Entrar com telefone',
    loginHint: 'Use um código de verificação. Um código de convite é necessário no primeiro acesso.',
    phoneLabel: 'Telefone / WhatsApp',
    countryCallingCodeLabel: 'País / código de discagem',
    phonePlaceholder: 'Digite o número local',
    phoneInputHint: 'Escolha o país e informe somente seu número local.',
    verificationCodeLabel: 'Código de verificação',
    verificationCodePlaceholder: 'Código de 6 dígitos',
    requestVerificationCode: 'Receber código',
    resendCountdown: (seconds: number) => `Tentar novamente em ${seconds}s`,
    inviteCodeRequiredLabel: 'Código de convite (obrigatório no primeiro cadastro)',
    inviteCodePlaceholder: 'Digite um código válido',
    signInWithPhone: 'Entrar com telefone',
    currentAccount: 'Conta atual',
    userAccount: (userId: number, countryCode: string) => `Usuário ${userId} · ${countryCode}`,
    goToBinding: 'Ir para vínculo',
    navigationLabel: 'Navegação principal',
  },
} as const

const passwordLoginCopyByLocale: Record<ConsumerLocale, {
  switchToPassword: string; switchToPhone: string; title: string; hint: string; passwordLabel: string
  passwordPlaceholder: string; submit: string; failure: string
}> = {
  zh: { switchToPassword: '账号密码登录', switchToPhone: '手机号码登录', title: '账号密码登录', hint: '仅限运营后台已开通密码登录的现有账号，无需短信验证码。', passwordLabel: '密码', passwordPlaceholder: '输入登录密码', submit: '登录', failure: '手机号或密码不正确，或尚未开通密码登录；请联系运营人员。' },
  en: { switchToPassword: 'Sign in with password', switchToPhone: 'Back to phone sign-in and registration', title: 'Sign in with password', hint: 'For existing accounts enabled by operations only. No SMS code is needed.', passwordLabel: 'Password', passwordPlaceholder: 'Enter your password', submit: 'Sign in', failure: 'Phone or password is incorrect, or password sign-in is not enabled. Contact support.' },
  es: { switchToPassword: 'Entrar con contraseña', switchToPhone: 'Volver al acceso y registro por teléfono', title: 'Entrar con contraseña', hint: 'Solo para cuentas existentes habilitadas por el equipo. No necesitas un código SMS.', passwordLabel: 'Contraseña', passwordPlaceholder: 'Ingresa tu contraseña', submit: 'Iniciar sesión', failure: 'Teléfono o contraseña incorrectos, o acceso no habilitado. Contacta a soporte.' },
  id: { switchToPassword: 'Masuk dengan kata sandi', switchToPhone: 'Kembali ke masuk dan daftar lewat ponsel', title: 'Masuk dengan kata sandi', hint: 'Hanya untuk akun lama yang sudah diaktifkan oleh tim. Tidak perlu kode SMS.', passwordLabel: 'Kata sandi', passwordPlaceholder: 'Masukkan kata sandi', submit: 'Masuk', failure: 'Nomor atau kata sandi salah, atau akses belum diaktifkan. Hubungi tim dukungan.' },
  pt: { switchToPassword: 'Entrar com senha', switchToPhone: 'Voltar ao acesso e cadastro por telefone', title: 'Entrar com senha', hint: 'Somente para contas existentes habilitadas pela equipe. Não precisa de código SMS.', passwordLabel: 'Senha', passwordPlaceholder: 'Digite sua senha', submit: 'Entrar', failure: 'Telefone ou senha incorretos, ou acesso não habilitado. Contate o suporte.' },
}

const clientPhoneCountries = (['CN', 'ID', 'MX', 'BR', 'HK'] as const).map((code) => phoneCountries.find((country) => country.countryCode === code)!)

function consumerCountryName(countryCode: string, locale: ConsumerLocale) {
  return phoneCountries.find((country) => country.countryCode === countryCode.toUpperCase())?.names[locale] ?? countryCode
}

const consumerLanguageNames: Record<ConsumerLocale, Record<ConsumerLocale, string>> = {
  zh: { zh: '中文', en: '英语', es: '西班牙语', id: '印尼语', pt: '葡萄牙语' },
  en: { zh: 'Chinese', en: 'English', es: 'Spanish', id: 'Indonesian', pt: 'Portuguese' },
  es: { zh: 'Chino', en: 'Inglés', es: 'Español', id: 'Indonesio', pt: 'Portugués' },
  id: { zh: 'Bahasa Mandarin', en: 'Bahasa Inggris', es: 'Bahasa Spanyol', id: 'Bahasa Indonesia', pt: 'Bahasa Portugis' },
  pt: { zh: 'Chinês', en: 'Inglês', es: 'Espanhol', id: 'Indonésio', pt: 'Português' },
}

function consumerLanguageName(languageCode: string, locale: ConsumerLocale) {
  const language = languageCode.toLowerCase().split(/[-_]/)[0] as ConsumerLocale
  return consumerLanguageNames[locale][language] ?? languageCode
}

const workspaceCopy: Record<ConsumerLocale, { title: string; dialogTitle: string; hint: string; choose: string; current: string; enter: string; bind: string; close: string; loading: string; error: string; emptyTitle: (app: string) => string; emptyHint: (app: string) => string; appSummary: (app: string) => string; bannerDescription: (app: string) => string; switchOtherApp: string }> = {
  zh: { title: '切换应用工作区', dialogTitle: '切换工作区', hint: '只切换查看的数据；邀请关系和账户归属不变。', choose: '选择应用', current: '当前工作区', enter: '切换工作区', bind: '去绑定', close: '关闭', loading: '读取应用状态中…', error: '应用状态暂不可用，请稍后重试。', emptyTitle: (app) => `${app} 账号尚未绑定`, emptyHint: (app) => `当前仅显示${app}的相关数据。绑定并通过核验后，才能查看该应用的收益与邀请数据。`, appSummary: (app) => `当前查看 ${app} 的用户和邀请收入`, bannerDescription: (app) => `当前仅显示${app}的相关数据。`, switchOtherApp: '切换其他应用' },
  en: { title: 'Switch app workspace', dialogTitle: 'Switch workspace', hint: 'Only your view changes; invitation relationships and account ownership stay the same.', choose: 'Choose an app', current: 'Current workspace', enter: 'Switch workspace', bind: 'Bind account', close: 'Close', loading: 'Loading app status…', error: 'App status is unavailable. Try again later.', emptyTitle: (app) => `${app} is not bound yet`, emptyHint: (app) => `Only ${app} data is shown here. Bind and verify this account to view its earnings and invitation data.`, appSummary: (app) => `Viewing ${app} users and invitation income`, bannerDescription: (app) => `Showing only data related to ${app}.`, switchOtherApp: 'Switch to another app' },
  es: { title: 'Cambiar espacio de aplicación', dialogTitle: 'Cambiar espacio', hint: 'Solo cambia la vista; tus invitaciones y tu cuenta no cambian.', choose: 'Elegir aplicación', current: 'Espacio actual', enter: 'Cambiar espacio', bind: 'Vincular', close: 'Cerrar', loading: 'Cargando estados…', error: 'Los estados no están disponibles. Inténtalo más tarde.', emptyTitle: (app) => `${app} aún no está vinculado`, emptyHint: (app) => `Aquí solo se muestran los datos de ${app}. Vincula y verifica la cuenta para ver sus ganancias e invitaciones.`, appSummary: (app) => `Viendo usuarios e ingresos por invitación de ${app}`, bannerDescription: (app) => `Solo se muestran los datos relacionados con ${app}.`, switchOtherApp: 'Cambiar a otra aplicación' },
  id: { title: 'Ganti ruang kerja aplikasi', dialogTitle: 'Ganti ruang kerja', hint: 'Hanya tampilan yang berubah; relasi undangan dan kepemilikan akun tetap sama.', choose: 'Pilih aplikasi', current: 'Ruang kerja saat ini', enter: 'Ganti ruang kerja', bind: 'Hubungkan', close: 'Tutup', loading: 'Memuat status aplikasi…', error: 'Status aplikasi tidak tersedia. Coba lagi nanti.', emptyTitle: (app) => `Akun ${app} belum terhubung`, emptyHint: (app) => `Hanya data ${app} yang ditampilkan. Hubungkan dan verifikasi akun untuk melihat penghasilan dan undangannya.`, appSummary: (app) => `Melihat pengguna dan penghasilan undangan ${app}`, bannerDescription: (app) => `Hanya menampilkan data terkait ${app}.`, switchOtherApp: 'Beralih ke aplikasi lain' },
  pt: { title: 'Trocar área do aplicativo', dialogTitle: 'Trocar área', hint: 'Apenas a visualização muda; convites e titularidade da conta permanecem iguais.', choose: 'Escolher aplicativo', current: 'Área atual', enter: 'Trocar área', bind: 'Vincular', close: 'Fechar', loading: 'Carregando status…', error: 'Status indisponível. Tente novamente.', emptyTitle: (app) => `${app} ainda não está vinculado`, emptyHint: (app) => `Somente os dados do ${app} aparecem aqui. Vincule e valide a conta para ver os ganhos e convites.`, appSummary: (app) => `Visualizando usuários e ganhos por convite do ${app}`, bannerDescription: (app) => `Exibindo apenas dados relacionados ao ${app}.`, switchOtherApp: 'Trocar para outro aplicativo' },
}

function consumerAppName(code: 'TIMO' | 'LINKY') {
  return code === 'TIMO' ? 'Timo' : 'Linky'
}

const consumerLoginHero: Record<ConsumerLocale, { small: string; large: string; alt: string }> = {
  zh: { small: loginHeroZh800, large: loginHeroZh1600, alt: '恭喜你！🎉 从女用户成长为长期收益的管理者。' },
  en: { small: loginHeroEn800, large: loginHeroEn1600, alt: 'Congratulations! 🎉 From female user to manager with long-term earnings.' },
  es: { small: loginHeroEs800, large: loginHeroEs1600, alt: '¡Felicidades! 🎉 De usuaria a gestora con ingresos a largo plazo.' },
  id: { small: loginHeroId800, large: loginHeroId1600, alt: 'Selamat! 🎉 Dari pengguna wanita menjadi pengelola dengan penghasilan jangka panjang.' },
  pt: { small: loginHeroPt800, large: loginHeroPt1600, alt: 'Parabéns! 🎉 De usuária a gestora com ganhos a longo prazo.' },
}
type ConsumerNavigationKey = 'earnings' | 'invite' | 'account'

const consumerUserGradeLabel: Record<ConsumerLocale, string> = {
  zh: '用户等级', en: 'Member level', es: 'Nivel de miembro', id: 'Level pengguna', pt: 'Nível do usuário',
}

const consumerNavigationCopy: Record<ConsumerLocale, Record<ConsumerNavigationKey, string>> = {
  zh: { earnings: '收益', invite: '邀请', account: '我的' },
  en: { earnings: 'Earnings', invite: 'Invite', account: 'Account' },
  es: { earnings: 'Ganancias', invite: 'Invitar', account: 'Cuenta' },
  id: { earnings: 'Penghasilan', invite: 'Undang', account: 'Akun' },
  pt: { earnings: 'Ganhos', invite: 'Convidar', account: 'Conta' },
}

const consumerAccountCopy = {
  zh: {
    title: '我的账户', subtitle: '管理你的身份资料与平台账号。', accountInfo: '账户信息', accountId: '用户编号', country: '归属国家 / 地区', language: '默认语言', platform: '绑定平台账号', linkyTitle: '绑定 Linky 账号', linkyHint: '绑定后，平台数据才能归入当前账户并进入奖励计算。', bindLinky: '绑定 Linky 账号', bindingTitle: '绑定 Linky 账号', bindingSubtitle: '你的注册手机号和邀请关系已自动带入，无需重复填写。', linkyAccount: 'Linky 账号（8 位数字）', linkyPlaceholder: '例如 12345678', bind: '提交 Linky 账号', binding: '提交中…', bindingSuccess: 'Linky 账号已绑定到当前账户。', bindingFailure: '绑定失败', signInTitle: '登录后管理平台账号', signInHint: '请先使用手机号登录，再绑定 Linky 账号。', signIn: '去手机号登录', active: '已提交', bound: '已绑定', navigationLabel: '主要导航', accountShortcut: '我的账户', inviteRelationship: '邀请关系已在首次注册时确认。', security: '账户安全', signOutHint: '退出当前设备的登录状态。', signOut: '退出登录', signingOut: '退出中…',
  },
  en: {
    title: 'My account', subtitle: 'Manage your identity details and platform account.', accountInfo: 'Account information', accountId: 'User ID', country: 'Country / region', language: 'Default language', platform: 'Bind platform accounts', linkyTitle: 'Bind Linky account', linkyHint: 'Bind it so platform activity belongs to this account and can be used for reward calculation.', bindLinky: 'Bind Linky account', bindingTitle: 'Bind Linky account', bindingSubtitle: 'Your registered phone and invitation relationship are already linked. You do not need to enter them again.', linkyAccount: 'Linky account (8 digits)', linkyPlaceholder: 'e.g. 12345678', bind: 'Submit Linky account', binding: 'Submitting…', bindingSuccess: 'Your Linky account is now bound to this account.', bindingFailure: 'Binding failed', signInTitle: 'Sign in to manage your platform account', signInHint: 'Use phone sign-in before binding a Linky account.', signIn: 'Sign in with phone', active: 'Submitted', bound: 'Bound', navigationLabel: 'Main navigation', accountShortcut: 'My account', inviteRelationship: 'Your invitation relationship was confirmed at first registration.', security: 'Account security', signOutHint: 'Sign out from this device.', signOut: 'Sign out', signingOut: 'Signing out…',
  },
  es: {
    title: 'Mi cuenta', subtitle: 'Administra tu identidad y tu cuenta de plataforma.', accountInfo: 'Información de cuenta', accountId: 'ID de usuario', country: 'País / región', language: 'Idioma predeterminado', platform: 'Vincular cuentas de plataforma', linkyTitle: 'Vincular cuenta Linky', linkyHint: 'Vincúlala para que la actividad de la plataforma pertenezca a esta cuenta y entre al cálculo de recompensas.', bindLinky: 'Vincular cuenta Linky', bindingTitle: 'Vincular cuenta Linky', bindingSubtitle: 'Tu teléfono registrado y relación de invitación ya están vinculados. No necesitas ingresarlos otra vez.', linkyAccount: 'Cuenta Linky (8 dígitos)', linkyPlaceholder: 'ej. 12345678', bind: 'Enviar cuenta Linky', binding: 'Enviando…', bindingSuccess: 'Tu cuenta Linky quedó vinculada a esta cuenta.', bindingFailure: 'Error al vincular', signInTitle: 'Inicia sesión para administrar tu cuenta', signInHint: 'Inicia sesión con teléfono antes de vincular una cuenta Linky.', signIn: 'Iniciar sesión', active: 'Enviada', bound: 'Vinculada', navigationLabel: 'Navegación principal', accountShortcut: 'Mi cuenta', inviteRelationship: 'Tu relación de invitación se confirmó al registrarte por primera vez.', security: 'Seguridad de la cuenta', signOutHint: 'Cierra sesión en este dispositivo.', signOut: 'Cerrar sesión', signingOut: 'Cerrando sesión…',
  },
  id: {
    title: 'Akun saya', subtitle: 'Kelola identitas dan akun platform kamu.', accountInfo: 'Informasi akun', accountId: 'ID pengguna', country: 'Negara / wilayah', language: 'Bahasa default', platform: 'Hubungkan akun platform', linkyTitle: 'Hubungkan akun Linky', linkyHint: 'Hubungkan agar aktivitas platform masuk ke akun ini dan dapat dihitung sebagai reward.', bindLinky: 'Hubungkan akun Linky', bindingTitle: 'Hubungkan akun Linky', bindingSubtitle: 'Nomor ponsel terdaftar dan relasi undanganmu sudah tertaut. Kamu tidak perlu mengisinya lagi.', linkyAccount: 'Akun Linky (8 digit)', linkyPlaceholder: 'contoh 12345678', bind: 'Kirim akun Linky', binding: 'Mengirim…', bindingSuccess: 'Akun Linky sudah terhubung ke akun ini.', bindingFailure: 'Gagal menghubungkan', signInTitle: 'Masuk untuk mengelola akun platform', signInHint: 'Masuk dengan nomor telepon sebelum menghubungkan akun Linky.', signIn: 'Masuk dengan telepon', active: 'Terkirim', bound: 'Terhubung', navigationLabel: 'Navigasi utama', accountShortcut: 'Akun saya', inviteRelationship: 'Relasi undanganmu sudah dikonfirmasi saat pendaftaran pertama.', security: 'Keamanan akun', signOutHint: 'Keluar dari perangkat ini.', signOut: 'Keluar', signingOut: 'Keluar…',
  },
  pt: {
    title: 'Minha conta', subtitle: 'Gerencie seus dados de identidade e sua conta da plataforma.', accountInfo: 'Informações da conta', accountId: 'ID do usuário', country: 'País / região', language: 'Idioma padrão', platform: 'Vincular contas da plataforma', linkyTitle: 'Vincular conta Linky', linkyHint: 'Vincule-a para que a atividade da plataforma pertença a esta conta e entre no cálculo das recompensas.', bindLinky: 'Vincular conta Linky', bindingTitle: 'Vincular conta Linky', bindingSubtitle: 'Seu telefone cadastrado e sua relação de convite já estão vinculados. Você não precisa informá-los novamente.', linkyAccount: 'Conta Linky (8 dígitos)', linkyPlaceholder: 'ex. 12345678', bind: 'Enviar conta Linky', binding: 'Enviando…', bindingSuccess: 'Sua conta Linky foi vinculada a esta conta.', bindingFailure: 'Falha no vínculo', signInTitle: 'Entre para gerenciar sua conta da plataforma', signInHint: 'Entre com telefone antes de vincular uma conta Linky.', signIn: 'Entrar com telefone', active: 'Enviada', bound: 'Vinculada', navigationLabel: 'Navegação principal', accountShortcut: 'Minha conta', inviteRelationship: 'Sua relação de convite foi confirmada no primeiro cadastro.', security: 'Segurança da conta', signOutHint: 'Sair deste dispositivo.', signOut: 'Sair', signingOut: 'Saindo…',
  },
} as const

function ConsumerAccountLink({ locale }: { locale: ConsumerLocale }) {
  return <a className="consumer-account-link" href="/account"><UserCircle weight="regular" aria-hidden="true" /><span>{consumerAccountCopy[locale].accountShortcut}</span><CaretRight weight="bold" aria-hidden="true" /></a>
}

function ConsumerBottomNavigation({ locale, active }: { locale: ConsumerLocale; active: ConsumerNavigationKey }) {
  const labels = consumerNavigationCopy[locale]
  const [earningsDialog, setEarningsDialog] = useState<'unbound' | 'error' | null>(null)
  const [checkingEarnings, setCheckingEarnings] = useState(false)
  const earningsClickInFlight = useRef(false)
  const earningsLink = useRef<HTMLAnchorElement>(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  useEffect(() => {
    if (!earningsDialog) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setEarningsDialog(null)
        earningsLink.current?.focus()
      }
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [earningsDialog])

  async function handleEarningsClick(event: ReactMouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    if (active === 'earnings' || earningsClickInFlight.current) return
    const session = loadJsonState<SessionState>(STORAGE_KEY)
    if (!session) { window.location.assign('/invite#phone-login'); return }
    earningsClickInFlight.current = true
    setCheckingEarnings(true)
    try {
      const workspace = await getConsumerWorkspace(session.userId, session.accessToken)
      if (!mounted.current) return
      if (canOpenEarningsWorkspace(workspace.selected)) window.location.assign('/earnings')
      else setEarningsDialog('unbound')
    } catch {
      if (mounted.current) setEarningsDialog('error')
    } finally {
      earningsClickInFlight.current = false
      if (mounted.current) setCheckingEarnings(false)
    }
  }

  function closeEarningsDialog() {
    setEarningsDialog(null)
    earningsLink.current?.focus()
  }

  return (
    <>
      <nav className="consumer-bottom-nav" aria-label={consumerAccountCopy[locale].navigationLabel}>
        <a ref={earningsLink} className={active === 'earnings' ? 'is-active' : undefined} href="/earnings" aria-current={active === 'earnings' ? 'page' : undefined} aria-busy={checkingEarnings || undefined} onClick={(event) => void handleEarningsClick(event)}><Wallet weight={active === 'earnings' ? 'fill' : 'regular'} aria-hidden="true" /><span>{labels.earnings}</span></a>
        <a className={active === 'invite' ? 'is-active' : undefined} href="/invite" aria-current={active === 'invite' ? 'page' : undefined}><UserPlus weight={active === 'invite' ? 'fill' : 'regular'} aria-hidden="true" /><span>{labels.invite}</span></a>
        <a className={active === 'account' ? 'is-active' : undefined} href="/account" aria-current={active === 'account' ? 'page' : undefined}><User weight={active === 'account' ? 'fill' : 'regular'} aria-hidden="true" /><span>{labels.account}</span></a>
      </nav>
      {earningsDialog ? <ConsumerUnboundDialog locale={locale} error={earningsDialog === 'error'} onClose={closeEarningsDialog} /> : null}
    </>
  )
}

const inviteErrorCopyByLocale = {
  zh: {
    invalidPhone: '请输入有效的手机号码。',
    codeAlreadySent: '验证码已发送，请在 60 秒后重新获取。',
    codeRequestLimited: '请求过于频繁，请稍后再试。',
    codeNotFound: '未找到验证码，请先获取验证码。',
    codeExpired: '验证码已过期，请重新获取。',
    codeAttemptsExceeded: '验证码尝试次数已达上限，请重新获取。',
    codeInvalid: '验证码不正确，请重新输入。',
    inviteCodeRequired: '首次注册需要有效的邀请码。',
    inviteCodeNotFound: '邀请码无效，请检查后重试。',
    phoneCountryMismatch: '所选国家与手机号码区号不一致。',
    sendFailed: '暂时无法发送验证码，请稍后再试。',
    signInFailed: '暂时无法登录，请稍后再试。',
  },
  en: {
    invalidPhone: 'Enter a valid phone number.',
    codeAlreadySent: 'A verification code was already sent. Try again in 60 seconds.',
    codeRequestLimited: 'Too many requests. Please try again later.',
    codeNotFound: 'No verification code was found. Request a new code first.',
    codeExpired: 'This verification code has expired. Request a new one.',
    codeAttemptsExceeded: 'Too many verification attempts. Request a new code.',
    codeInvalid: 'The verification code is incorrect. Try again.',
    inviteCodeRequired: 'A valid invite code is required for first registration.',
    inviteCodeNotFound: 'This invite code is invalid. Check it and try again.',
    phoneCountryMismatch: 'The selected country does not match the phone calling code.',
    sendFailed: 'We could not send a verification code. Please try again later.',
    signInFailed: 'We could not sign you in. Please try again later.',
  },
  es: {
    invalidPhone: 'Ingresa un número de teléfono válido.',
    codeAlreadySent: 'Ya se envió un código. Inténtalo de nuevo en 60 segundos.',
    codeRequestLimited: 'Demasiadas solicitudes. Inténtalo de nuevo más tarde.',
    codeNotFound: 'No encontramos un código. Solicita uno nuevo primero.',
    codeExpired: 'El código venció. Solicita uno nuevo.',
    codeAttemptsExceeded: 'Se alcanzó el límite de intentos. Solicita un código nuevo.',
    codeInvalid: 'El código no es correcto. Inténtalo de nuevo.',
    inviteCodeRequired: 'Se requiere un código válido para el primer registro.',
    inviteCodeNotFound: 'El código de invitación no es válido. Revísalo e inténtalo de nuevo.',
    phoneCountryMismatch: 'El país seleccionado no coincide con el prefijo telefónico.',
    sendFailed: 'No pudimos enviar el código. Inténtalo de nuevo más tarde.',
    signInFailed: 'No pudimos iniciar sesión. Inténtalo de nuevo más tarde.',
  },
  id: {
    invalidPhone: 'Masukkan nomor telepon yang valid.',
    codeAlreadySent: 'Kode verifikasi sudah dikirim. Coba lagi dalam 60 detik.',
    codeRequestLimited: 'Terlalu banyak permintaan. Coba lagi nanti.',
    codeNotFound: 'Kode verifikasi tidak ditemukan. Minta kode baru terlebih dahulu.',
    codeExpired: 'Kode verifikasi sudah kedaluwarsa. Minta kode baru.',
    codeAttemptsExceeded: 'Batas percobaan verifikasi sudah tercapai. Minta kode baru.',
    codeInvalid: 'Kode verifikasi tidak benar. Coba lagi.',
    inviteCodeRequired: 'Kode undangan yang valid diperlukan untuk pendaftaran pertama.',
    inviteCodeNotFound: 'Kode undangan tidak valid. Periksa lalu coba lagi.',
    phoneCountryMismatch: 'Negara yang dipilih tidak sesuai dengan kode panggilan nomor telepon.',
    sendFailed: 'Kode verifikasi belum dapat dikirim. Coba lagi nanti.',
    signInFailed: 'Belum dapat masuk. Coba lagi nanti.',
  },
  pt: {
    invalidPhone: 'Digite um número de telefone válido.',
    codeAlreadySent: 'Um código já foi enviado. Tente novamente em 60 segundos.',
    codeRequestLimited: 'Muitas solicitações. Tente novamente mais tarde.',
    codeNotFound: 'Não encontramos um código. Solicite um novo primeiro.',
    codeExpired: 'O código expirou. Solicite um novo.',
    codeAttemptsExceeded: 'O limite de tentativas foi atingido. Solicite um novo código.',
    codeInvalid: 'O código não está correto. Tente novamente.',
    inviteCodeRequired: 'Um código de convite válido é necessário no primeiro cadastro.',
    inviteCodeNotFound: 'O código de convite não é válido. Confira e tente novamente.',
    phoneCountryMismatch: 'O país selecionado não corresponde ao código de discagem do telefone.',
    sendFailed: 'Não foi possível enviar o código. Tente novamente mais tarde.',
    signInFailed: 'Não foi possível fazer login. Tente novamente mais tarde.',
  },
} as const

// eslint-disable-next-line react-refresh/only-export-components
export function localizeInviteOperationError(error: unknown, locale: keyof typeof inviteErrorCopyByLocale, operation: 'send' | 'signIn') {
  const rawMessage = error instanceof Error ? error.message.toLowerCase() : ''
  const copy = inviteErrorCopyByLocale[locale]
  if (rawMessage.includes('phone number is invalid')) return copy.invalidPhone
  if (rawMessage.includes('phone verification code already sent')) return copy.codeAlreadySent
  if (rawMessage.includes('too many request')) return copy.codeRequestLimited
  if (rawMessage.includes('verification code not found')) return copy.codeNotFound
  if (rawMessage.includes('verification code expired')) return copy.codeExpired
  if (rawMessage.includes('verification attempts exceeded')) return copy.codeAttemptsExceeded
  if (rawMessage.includes('verification code invalid')) return copy.codeInvalid
  if (rawMessage.includes('valid invite code is required')) return copy.inviteCodeRequired
  if (rawMessage.includes('invite code not found')) return copy.inviteCodeNotFound
  if (rawMessage.includes('registration requires a +')) return copy.phoneCountryMismatch
  return operation === 'send' ? copy.sendFailed : copy.signInFailed
}

function InviteCodePage() {
  const [session, setSession] = useState<SessionState | null>(() => loadJsonState<SessionState>(STORAGE_KEY))
  const [workspace, setWorkspace] = useState<ConsumerWorkspaceResponse | null>(null)
  const [locale, setLocale] = useState<keyof typeof externalPageCopyByLocale>(() => loadExternalLocale())
  const [loginMode, setLoginMode] = useState<'phone' | 'password'>(() => typeof window !== 'undefined' && window.location.hash === '#password-login' ? 'password' : 'phone')
  const [loginPassword, setLoginPassword] = useState('')
  const [countryManuallyChosen, setCountryManuallyChosen] = useState(() => typeof window !== 'undefined' && !!window.localStorage.getItem(CLIENT_COUNTRY_KEY))
  const incomingInviteCode = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('inviteCode')?.trim().toUpperCase() ?? '' : ''
  const [phoneForm, setPhoneForm] = useState({
    phoneNumber: '',
    verificationCode: '',
    inviteCode: incomingInviteCode || session?.inviteCode || '',
    countryCode: initialClientCountry(loadExternalLocale(), session?.countryCode),
    languageCode: session?.languageCode ?? languageForLocale(loadExternalLocale()),
  })
  const [phoneCodeHint, setPhoneCodeHint] = useState('')
  const [phoneCodeCooldownSeconds, setPhoneCodeCooldownSeconds] = useState(0)
  const [phoneAuthLoading, setPhoneAuthLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [failedHeroLocale, setFailedHeroLocale] = useState<ConsumerLocale | null>(null)
  const copy = externalPageCopyByLocale[locale]
  const inviteCopy = invitePageCopyByLocale[locale]
  const passwordCopy = passwordLoginCopyByLocale[locale]
  const loginHero = consumerLoginHero[locale]
  const selectedPhoneCountry = clientPhoneCountries.find((country) => country.countryCode === phoneForm.countryCode) ?? clientPhoneCountries[0]
  const phoneNumberForSubmission = formatPhoneNumber(selectedPhoneCountry.callingCode, phoneForm.phoneNumber)

  function changeLoginLocale(next: ConsumerLocale) {
    setLocale(next)
    setPhoneForm((current) => ({ ...current, languageCode: languageForLocale(next),
      countryCode: !countryManuallyChosen && !current.phoneNumber && !current.verificationCode && !phoneCodeCooldownSeconds
        ? suggestedClientCountry(next) : current.countryCode }))
  }

  function choosePhoneCountry(countryCode: ClientCountryCode) {
    setCountryManuallyChosen(true)
    window.localStorage.setItem(CLIENT_COUNTRY_KEY, countryCode)
    setPhoneForm((current) => ({ ...current, countryCode }))
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(EXTERNAL_LOCALE_KEY, locale)
    }
  }, [locale])

  useEffect(() => {
    if (!session) return
    let active = true
    void getConsumerWorkspace(session.userId, session.accessToken)
      .then((value) => { if (active) setWorkspace(value) })
      .catch(() => { if (active) setWorkspace(null) })
    return () => { active = false }
  }, [session])

  useEffect(() => {
    if (phoneCodeCooldownSeconds <= 0) return undefined
    const timer = window.setTimeout(() => setPhoneCodeCooldownSeconds((seconds) => Math.max(0, seconds - 1)), 1000)
    return () => window.clearTimeout(timer)
  }, [phoneCodeCooldownSeconds])

  useEffect(() => {
    if (!success) return undefined
    const timer = window.setTimeout(() => setSuccess(''), 4000)
    return () => window.clearTimeout(timer)
  }, [success])

  async function handleCopyInviteCode() {
    const inviteCode = session?.inviteCode
    if (!inviteCode) return
    try {
      await navigator.clipboard.writeText(inviteCode)
      setSuccess(copy.copySuccess)
      setError('')
    } catch {
      setError(copy.copyFailure)
    }
  }

  async function handleShareInviteCode() {
    if (!session?.inviteCode) return
    const shareUrl = `${consumerEntryOrigin(window.location.origin)}/invite?inviteCode=${encodeURIComponent(session.inviteCode)}`
    try {
      if (navigator.share) {
        await navigator.share({ title: inviteCopy.shareTitle, text: inviteCopy.shareText(session.inviteCode), url: shareUrl })
      } else {
        await navigator.clipboard.writeText(shareUrl)
        setSuccess(inviteCopy.shareCopied)
      }
      setError('')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError(inviteCopy.shareFailure)
    }
  }

  async function handleIssuePhoneCode() {
    setPhoneAuthLoading(true)
    setError('')
    setSuccess('')
    try {
      const response = await issuePhoneCode(phoneNumberForSubmission)
      const internalNotice = selectedPhoneCountry.countryCode === 'CN'
        ? internalPhoneCodeNotice(locale, response.ttlMinutes)
        : null
      setPhoneCodeHint(internalNotice?.hint ?? inviteCopy.phoneCodeHint(response.verificationCode, response.ttlMinutes))
      setPhoneCodeCooldownSeconds(response.resendCooldownSeconds ?? 60)
      setSuccess(internalNotice?.success ?? inviteCopy.phoneCodeSent)
    } catch (err) {
      if (err instanceof Error && err.message.toLowerCase().includes('phone verification code already sent')) {
        setPhoneCodeCooldownSeconds(60)
      }
      setError(localizeInviteOperationError(err, locale, 'send'))
    } finally {
      setPhoneAuthLoading(false)
    }
  }

  async function handlePhoneLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPhoneAuthLoading(true)
    setError('')
    setSuccess('')
    try {
      const profile = await phoneLogin({
        phoneNumber: phoneNumberForSubmission,
        verificationCode: phoneForm.verificationCode,
        inviteCode: phoneForm.inviteCode || undefined,
        countryCode: phoneForm.countryCode || undefined,
        languageCode: phoneForm.languageCode || undefined,
      })
      const nextSession = saveUserSession(profile)
      setSession(nextSession)
      setPhoneForm({ ...phoneForm, inviteCode: profile.inviteCode, countryCode: profile.countryCode as ClientCountryCode, languageCode: profile.languageCode })
      window.location.assign('/app')
    } catch (err) {
      setError(localizeInviteOperationError(err, locale, 'signIn'))
    } finally {
      setPhoneAuthLoading(false)
    }
  }

  function switchLoginMode(mode: 'phone' | 'password') {
    setLoginMode(mode)
    setLoginPassword('')
    setError('')
    setSuccess('')
    window.history.replaceState(null, '', `#${mode}-login`)
  }

  async function handlePasswordLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPhoneAuthLoading(true)
    setError('')
    try {
      const profile = await passwordLogin({ phoneNumber: phoneNumberForSubmission, password: loginPassword })
      setSession(saveUserSession(profile))
      setLoginPassword('')
      window.location.assign('/app')
    } catch {
      setError(passwordCopy.failure)
    } finally {
      setPhoneAuthLoading(false)
    }
  }

  return (
    <div className="consumer-app-page">
      <main className={`consumer-shell consumer-form-shell${session ? '' : ' consumer-login-shell'}`}>
        <header className="consumer-topbar">
          <a className="consumer-brand" href="/earnings"><img className="consumer-brand-logo" src="/bandeira-logo-v1.png" alt="" />BANDEIRA</a>
          <div className="consumer-topbar-actions">
            <label className="consumer-language-select">
              <select aria-label={copy.languageLabel} value={locale} onChange={(event) => changeLoginLocale(event.target.value as ConsumerLocale)}>
                <option value="zh">中文</option><option value="en">English</option><option value="es">Español</option><option value="id">Bahasa Indonesia</option><option value="pt">Português</option>
              </select>
            </label>
            {session ? <ConsumerAccountLink locale={locale} /> : null}
          </div>
        </header>

        {!session ? <section className="consumer-login-hero">
          {failedHeroLocale === locale ? <p className="consumer-login-hero-fallback">{loginHero.alt}</p> : <img
            key={locale}
            src={loginHero.small}
            srcSet={`${loginHero.small} 800w, ${loginHero.large} 1600w`}
            sizes="(max-width: 720px) calc(100vw - 40px), 640px"
            width="1720"
            height="914"
            alt={loginHero.alt}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            onError={() => setFailedHeroLocale(locale)}
          />}
        </section> : null}

        {session ? <section className="consumer-commercial-heading">
          <p><Diamond weight="fill" aria-hidden="true" /> BANDEIRA REWARDS</p>
          <h1>{copy.inviteTitle}</h1>
          <span>{copy.inviteSubtitle}</span>
        </section> : null}

        {session && workspace && !workspace.selected ? <ConsumerUnboundGuidance locale={locale} /> : null}

        {error ? <div className="consumer-banner is-error"><strong>{inviteCopy.errorTitle}</strong><span>{error}</span></div> : null}
        {success ? <div className="consumer-banner is-success"><CheckCircle size={20} weight="fill" /><span>{success}</span></div> : null}

        {session ? (
          <section className="consumer-invite-card">
            <div className="consumer-invite-card-top"><span>{inviteCopy.inviteBenefit}</span><Diamond weight="fill" aria-hidden="true" /></div>
            <p>{inviteCopy.myInviteCode}</p>
            <strong>{session.inviteCode}</strong>
            <span className="consumer-invite-caption">{inviteCopy.inviteProgressHint}</span>
            <div className="consumer-invite-actions">
              <button type="button" onClick={handleCopyInviteCode}><Copy size={21} />{copy.copyInviteCode}</button>
              <button type="button" onClick={handleShareInviteCode}><ShareNetwork size={21} />{inviteCopy.shareInviteLink}</button>
            </div>
          </section>
        ) : <>
          {loginMode === 'phone' ? <form id="phone-login" className="consumer-form-card" onSubmit={handlePhoneLogin}>
            <div className="consumer-form-card-heading"><div><h2>{inviteCopy.loginTitle}</h2><p>{inviteCopy.loginHint}</p></div><ShieldCheck size={28} weight="duotone" /></div>
            <label className="consumer-field">
              <span>{inviteCopy.phoneLabel}</span>
              <div className="consumer-phone-input">
                <select
                  aria-label={inviteCopy.countryCallingCodeLabel}
                  value={selectedPhoneCountry.countryCode}
                  onChange={(event) => choosePhoneCountry(event.target.value as ClientCountryCode)}
                >
                  {clientPhoneCountries.map((country) => <option key={country.countryCode} value={country.countryCode}>{country.names[locale]} {country.callingCode}</option>)}
                </select>
                <input
                  value={phoneForm.phoneNumber}
                  onChange={(event) => setPhoneForm({ ...phoneForm, phoneNumber: normalizeLocalPhoneNumber(event.target.value, selectedPhoneCountry.callingCode) })}
                  placeholder={inviteCopy.phonePlaceholder}
                  inputMode="tel"
                  autoComplete="tel-national"
                />
              </div>
              <small className="consumer-phone-input-hint">{inviteCopy.phoneInputHint}</small>
            </label>
            <label className="consumer-field"><span>{inviteCopy.verificationCodeLabel}</span><div className="consumer-code-row"><input value={phoneForm.verificationCode} onChange={(e) => setPhoneForm({ ...phoneForm, verificationCode: e.target.value.replace(/\D/g, '').slice(0, 6) })} placeholder={inviteCopy.verificationCodePlaceholder} inputMode="numeric" autoComplete="one-time-code" /><button type="button" onClick={handleIssuePhoneCode} disabled={phoneAuthLoading || !phoneNumberForSubmission || phoneCodeCooldownSeconds > 0}>{phoneCodeCooldownSeconds > 0 ? inviteCopy.resendCountdown(phoneCodeCooldownSeconds) : inviteCopy.requestVerificationCode}</button></div></label>
            <label className="consumer-field"><span>{inviteCopy.inviteCodeRequiredLabel}</span><input value={phoneForm.inviteCode} onChange={(e) => setPhoneForm({ ...phoneForm, inviteCode: e.target.value.trim().toUpperCase() })} placeholder={inviteCopy.inviteCodePlaceholder} /></label>
            {phoneCodeHint ? <p className="consumer-form-note">{phoneCodeHint}</p> : null}
            <button className="consumer-form-submit" type="submit" disabled={phoneAuthLoading || !phoneNumberForSubmission || phoneForm.verificationCode.length < 6}><SignIn size={21} />{inviteCopy.signInWithPhone}</button>
          </form> : <form id="password-login" className="consumer-form-card" onSubmit={handlePasswordLogin}>
            <div className="consumer-form-card-heading"><div><h2>{passwordCopy.title}</h2><p>{passwordCopy.hint}</p></div><LockSimple size={28} weight="duotone" /></div>
            <label className="consumer-field">
              <span>{inviteCopy.phoneLabel}</span>
              <div className="consumer-phone-input">
                <select aria-label={inviteCopy.countryCallingCodeLabel} value={selectedPhoneCountry.countryCode} onChange={(event) => choosePhoneCountry(event.target.value as ClientCountryCode)}>
                  {clientPhoneCountries.map((country) => <option key={country.countryCode} value={country.countryCode}>{country.names[locale]} {country.callingCode}</option>)}
                </select>
                <input value={phoneForm.phoneNumber} onChange={(event) => setPhoneForm({ ...phoneForm, phoneNumber: normalizeLocalPhoneNumber(event.target.value, selectedPhoneCountry.callingCode) })} placeholder={inviteCopy.phonePlaceholder} inputMode="tel" autoComplete="username" />
              </div>
              <small className="consumer-phone-input-hint">{inviteCopy.phoneInputHint}</small>
            </label>
            <label className="consumer-field"><span>{passwordCopy.passwordLabel}</span><input type="password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} placeholder={passwordCopy.passwordPlaceholder} autoComplete="current-password" /></label>
            <button className="consumer-form-submit" type="submit" disabled={phoneAuthLoading || !phoneNumberForSubmission || !loginPassword}><SignIn size={21} />{passwordCopy.submit}</button>
          </form>}
          <button type="button" className="consumer-login-switch" onClick={() => switchLoginMode(loginMode === 'phone' ? 'password' : 'phone')}>{loginMode === 'phone' ? passwordCopy.switchToPassword : passwordCopy.switchToPhone}</button>
        </>}

        {session ? <InvitationProgressPanel key={workspace?.selected || 'TIMO'} userId={session.userId} accessToken={session.accessToken} locale={locale} initialPlatform={workspace?.selected || 'TIMO'} /> : null}

        {session ? <ConsumerBottomNavigation locale={locale} active="invite" /> : null}
      </main>
    </div>
  )
}

function AccountPage() {
  const [session, setSession] = useState<SessionState | null>(() => loadJsonState<SessionState>(STORAGE_KEY))
  const [locale, setLocale] = useState<ConsumerLocale>(() => loadExternalLocale())
  const [workspace, setWorkspace] = useState<ConsumerWorkspaceResponse | null>(null)
  const [workspaceError, setWorkspaceError] = useState(false)
  const [workspaceDialogOpen, setWorkspaceDialogOpen] = useState(false)
  const [firstBindingDialogOpen, setFirstBindingDialogOpen] = useState(false)
  const [switchingWorkspace, setSwitchingWorkspace] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [linkyBinding, setLinkyBinding] = useState<LinkyAccountBindingResponse | null>(null)
  const [timoBinding, setTimoBinding] = useState<PlatformBindingResponse | null>(null)
  const [linkyStatusLoading, setLinkyStatusLoading] = useState(true)
  const [timoStatusLoading, setTimoStatusLoading] = useState(true)
  const [linkyStatusError, setLinkyStatusError] = useState(false)
  const [timoStatusError, setTimoStatusError] = useState(false)
  const [userGradeCode, setUserGradeCode] = useState('NORMAL_MEMBER')
  const copy = consumerAccountCopy[locale]
  const timoCopy = timoBindingCopy[locale]
  const workCopy = workspaceCopy[locale]
  const accountWorkspace = resolveConsumerAccountWorkspace(workspace)

  useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem(EXTERNAL_LOCALE_KEY, locale)
  }, [locale])

  useEffect(() => {
    if (!session) return
    let active = true
    void getConsumerWorkspace(session.userId, session.accessToken)
      .then((value) => {
        if (!active) return
        setWorkspace(value)
      })
      .catch(() => { if (active) setWorkspaceError(true) })
    void getVerifiedLinkyAccountBinding(session.userId, session.accessToken)
      .then((value) => { if (active) setLinkyBinding(value) })
      .catch((error) => { if (active) { setLinkyBinding(null); setLinkyStatusError(!String(error).includes('verified Linky binding not found')) } })
      .finally(() => { if (active) setLinkyStatusLoading(false) })
    void getPlatformBinding(session.userId, session.accessToken, 'TIMO')
      .then((value) => { if (active) setTimoBinding(value) })
      .catch((error) => { if (active) { setTimoBinding(null); setTimoStatusError(!String(error).includes('platform binding not found')) } })
      .finally(() => { if (active) setTimoStatusLoading(false) })
    void getDistributionHome(session.userId, session.accessToken)
      .then((value) => { if (active) setUserGradeCode(value.userGradeCode) })
      .catch(() => { if (active) setUserGradeCode('NORMAL_MEMBER') })
    return () => { active = false }
  }, [session])

  useEffect(() => {
    if (!session || !workspace || linkyStatusLoading || timoStatusLoading || linkyStatusError || timoStatusError
        || workspace.apps.some((app) => app.verified) || linkyBinding
        || timoBinding?.status === 'SUBMITTED' || timoBinding?.status === 'VERIFYING' || timoBinding?.status === 'VERIFIED') return
    const key = `fenxiao-binding-guidance-${session.userId}`
    if (window.sessionStorage.getItem(key)) return
    window.sessionStorage.setItem(key, 'shown')
    const timer = window.setTimeout(() => setFirstBindingDialogOpen(true), 0)
    return () => window.clearTimeout(timer)
  }, [session, workspace, linkyStatusLoading, timoStatusLoading, linkyStatusError, timoStatusError, linkyBinding, timoBinding])

  const statusCopy = {
    zh: { unbound: '未绑定', submitted: '绑定中', verifying: '核验中', verified: '已绑定', rejected: '核验未通过', loading: '状态读取中', error: '状态暂不可用', view: '查看详情' },
    en: { unbound: 'Not bound', submitted: 'Binding', verifying: 'Verifying', verified: 'Bound', rejected: 'Not verified', loading: 'Loading status', error: 'Status unavailable', view: 'View details' },
    es: { unbound: 'Sin vincular', submitted: 'Vinculando', verifying: 'Verificando', verified: 'Vinculada', rejected: 'No verificada', loading: 'Cargando estado', error: 'Estado no disponible', view: 'Ver detalles' },
    id: { unbound: 'Belum terhubung', submitted: 'Menghubungkan', verifying: 'Memverifikasi', verified: 'Terhubung', rejected: 'Verifikasi gagal', loading: 'Memuat status', error: 'Status tidak tersedia', view: 'Lihat detail' },
    pt: { unbound: 'Não vinculada', submitted: 'Vinculando', verifying: 'Verificando', verified: 'Vinculada', rejected: 'Não verificada', loading: 'Carregando status', error: 'Status indisponível', view: 'Ver detalhes' },
  }[locale]
  const timoStatus = timoStatusLoading ? statusCopy.loading : timoStatusError ? statusCopy.error
    : timoBinding?.status === 'VERIFIED' ? statusCopy.verified
      : timoBinding?.status === 'VERIFYING' ? timoBinding.verificationState === 'MANUAL_REVIEW_REQUIRED' ? timoHelpCopy[locale].manual
        : timoBinding.verificationState === 'ERROR' ? timoHelpCopy[locale].technical
          : timoBinding.verificationState === 'SOURCE_STALE' ? timoHelpCopy[locale].waiting : statusCopy.verifying
        : timoBinding?.status === 'SUBMITTED' ? statusCopy.submitted
          : timoBinding?.status === 'REJECTED' ? statusCopy.rejected : statusCopy.unbound
  const linkyStatus = linkyStatusLoading ? statusCopy.loading : linkyStatusError ? statusCopy.error
    : linkyBinding?.status === 'VERIFIED' ? statusCopy.verified : statusCopy.unbound

  async function handleSwitchWorkspace(platformCode: 'TIMO' | 'LINKY') {
    if (!session || switchingWorkspace) return
    setSwitchingWorkspace(true)
    setWorkspaceError(false)
    try {
      const next = await selectConsumerWorkspace(session.userId, session.accessToken, platformCode)
      setWorkspace(next)
      window.location.assign('/earnings')
    } catch {
      setWorkspaceError(true)
      setSwitchingWorkspace(false)
    }
  }

  async function handleSignOut() {
    if (!session || signingOut) return
    setSigningOut(true)
    try {
      await logoutUserSession(session.accessToken)
    } catch {
      // Local session removal still protects this device if a network interruption prevents server revocation.
    } finally {
      window.localStorage.removeItem(STORAGE_KEY)
      setSession(null)
      window.location.assign('/invite#phone-login')
    }
  }

  return (
    <div className="consumer-app-page">
      <main className="consumer-shell consumer-form-shell">
        <header className="consumer-topbar">
          <a className="consumer-brand" href="/earnings"><img className="consumer-brand-logo" src="/bandeira-logo-v1.png" alt="" />BANDEIRA</a>
          <div className="consumer-topbar-actions">
            <label className="consumer-language-select"><select aria-label={externalPageCopyByLocale[locale].languageLabel} value={locale} onChange={(event) => setLocale(event.target.value as ConsumerLocale)}><option value="zh">中文</option><option value="en">English</option><option value="es">Español</option><option value="id">Bahasa Indonesia</option><option value="pt">Português</option></select></label>
          </div>
        </header>

        {session ? (
          <>
            <section className="consumer-commercial-heading"><p><Diamond weight="fill" aria-hidden="true" /> BANDEIRA REWARDS</p><h1>{copy.title}</h1><span>{copy.subtitle}</span></section>
            {workspace && !accountWorkspace.selected ? <ConsumerUnboundGuidance locale={locale} bindHref="#consumer-platform-bindings" /> : null}
            <section className="consumer-account-overview">
              <div className="consumer-account-overview-icon"><IdentificationCard weight="duotone" aria-hidden="true" /></div>
              <div className="consumer-account-details"><span>{copy.accountInfo}</span><strong>{copy.accountId} · {session.userId}</strong></div>
              <div className="consumer-user-grade-card"><span>{consumerUserGradeLabel[locale]}</span><strong>{formatConsumerUserGrade(userGradeCode, locale)}</strong></div>
            </section>
            <section className="consumer-settings-card">
              <h2>{copy.accountInfo}</h2>
              <dl><div><dt>{copy.country}</dt><dd>{consumerCountryName(session.countryCode, locale)}</dd></div><div><dt>{copy.language}</dt><dd>{consumerLanguageName(session.languageCode, locale)}</dd></div></dl>
            </section>
            <section id="consumer-platform-bindings" className="consumer-settings-card consumer-platform-card">
              <div className="consumer-platform-card-head"><span className="consumer-platform-icon"><LinkSimple weight="bold" aria-hidden="true" /></span><div><h2>{copy.platform}</h2></div></div>
              <div className="consumer-platform-account-list">
                {accountWorkspace.visibleBindings.includes('LINKY') ? <div className="consumer-platform-account-row"><div><strong>{copy.linkyTitle}</strong><span className="consumer-platform-status" role="status">{linkyStatus}{linkyBinding?.status === 'VERIFIED' ? ` · ${linkyBinding.linkyAccount}` : ''}</span></div>{linkyBinding?.status === 'VERIFIED' ? <CheckCircle weight="fill" className="consumer-status-check" aria-hidden="true" /> : <a className="consumer-secondary-link" href="/account/linky">{linkyStatusLoading ? statusCopy.loading : copy.bindLinky}<ArrowRight weight="bold" aria-hidden="true" /></a>}</div> : null}
                {accountWorkspace.visibleBindings.includes('TIMO') ? <div className="consumer-platform-account-row"><div><strong>{timoCopy.open}</strong><span className="consumer-platform-status" role="status">{timoStatus}{timoBinding?.platformUserId ? ` · ${timoBinding.platformUserId}` : ''}</span></div>{timoBinding?.status === 'VERIFIED' ? <CheckCircle weight="fill" className="consumer-status-check" aria-hidden="true" /> : <a className="consumer-secondary-link" href="/account/timo">{timoBinding ? statusCopy.view : timoStatusLoading ? statusCopy.loading : timoCopy.open}<ArrowRight weight="bold" aria-hidden="true" /></a>}</div> : null}
                {!workspace ? <p>{workspaceError ? workCopy.error : workCopy.loading}</p> : null}
              </div>
            </section>
            {accountWorkspace.canSwitch ? <section className="consumer-settings-card consumer-workspace-card">
              <button className="consumer-workspace-trigger" type="button" onClick={() => setWorkspaceDialogOpen(true)} aria-haspopup="dialog"><span>{workCopy.title}</span><strong>{consumerAppName(accountWorkspace.selected!)}</strong><CaretRight weight="bold" aria-hidden="true" /></button>
              {workspaceError ? <p className="consumer-workspace-error" role="alert">{workCopy.error}</p> : null}
            </section> : null}
            <section className="consumer-settings-card consumer-security-card">
              <div className="consumer-security-copy"><span className="consumer-security-icon"><ShieldCheck weight="duotone" aria-hidden="true" /></span><div><h2>{copy.security}</h2><p>{copy.signOutHint}</p></div></div>
              <button className="consumer-sign-out-button" type="button" onClick={() => void handleSignOut()} disabled={signingOut}><SignOut weight="bold" aria-hidden="true" />{signingOut ? copy.signingOut : copy.signOut}</button>
            </section>
            {workspaceDialogOpen && accountWorkspace.canSwitch ? <div className="consumer-modal-backdrop" onClick={() => setWorkspaceDialogOpen(false)}>
              <section className="consumer-workspace-dialog" role="dialog" aria-modal="true" aria-label={workCopy.dialogTitle} onClick={(event) => event.stopPropagation()}>
                <h2>{workCopy.dialogTitle}</h2>
                {workspace ? (['TIMO', 'LINKY'] as const).map((code) => {
                  const status = code === 'TIMO' ? timoStatus : linkyStatus
                  return <div className="consumer-workspace-option" key={code}><div><strong>{consumerAppName(code)}</strong><small>{status}{workspace.selected === code ? ` · ${workCopy.current}` : ''}</small></div>
                    <button type="button" disabled={switchingWorkspace || workspace.selected === code} onClick={() => void handleSwitchWorkspace(code)}>{workspace.selected === code ? workCopy.current : workCopy.enter}</button></div>
                }) : <p>{workspaceError ? workCopy.error : workCopy.loading}</p>}
                <button className="consumer-workspace-close" type="button" onClick={() => setWorkspaceDialogOpen(false)}>{workCopy.close}</button>
              </section>
            </div> : null}
            {firstBindingDialogOpen ? <ConsumerUnboundDialog locale={locale} onClose={() => setFirstBindingDialogOpen(false)} /> : null}
          </>
        ) : (
          <section className="consumer-auth-gate"><div className="consumer-auth-icon"><LockSimple weight="duotone" aria-hidden="true" /></div><h1>{copy.signInTitle}</h1><p>{copy.signInHint}</p><a className="consumer-primary-link" href="/invite#phone-login">{copy.signIn}<ArrowRight weight="bold" aria-hidden="true" /></a></section>
        )}
        {session ? <ConsumerBottomNavigation locale={locale} active="account" /> : null}
      </main>
    </div>
  )
}

const consumerProfileCopy = {
  zh: { title: '个人资料', back: '返回收益', nickname: '昵称', avatar: '头像', avatarHint: '请选择 PNG 或 JPG 图片；较大的照片会自动缩小并压缩至头像要求。', save: '保存昵称', saving: '保存中…', saved: '已保存，无需审核', upload: '上传头像', loading: '读取中…', failed: '保存失败，请稍后重试。', invalid: '无法处理这张图片。请选择可正常打开的 PNG 或 JPG 照片后重试。' },
  en: { title: 'My profile', back: 'Back to earnings', nickname: 'Nickname', avatar: 'Avatar', avatarHint: 'Choose a PNG or JPG image. Larger photos are resized and compressed automatically.', save: 'Save nickname', saving: 'Saving…', saved: 'Saved without review', upload: 'Upload avatar', loading: 'Loading…', failed: 'Could not save. Try again.', invalid: 'This image could not be processed. Choose a readable PNG or JPG photo and try again.' },
  es: { title: 'Mi perfil', back: 'Volver a ganancias', nickname: 'Apodo', avatar: 'Foto de perfil', avatarHint: 'Elige una imagen PNG o JPG. Las fotos grandes se reducen y comprimen automáticamente.', save: 'Guardar apodo', saving: 'Guardando…', saved: 'Guardado sin revisión', upload: 'Subir foto', loading: 'Cargando…', failed: 'No se pudo guardar. Inténtalo otra vez.', invalid: 'No se pudo procesar esta imagen. Elige una foto PNG o JPG válida e inténtalo de nuevo.' },
  id: { title: 'Profil saya', back: 'Kembali ke penghasilan', nickname: 'Nama panggilan', avatar: 'Foto profil', avatarHint: 'Pilih gambar PNG atau JPG. Foto besar akan diperkecil dan dikompresi otomatis.', save: 'Simpan nama', saving: 'Menyimpan…', saved: 'Tersimpan tanpa peninjauan', upload: 'Unggah foto', loading: 'Memuat…', failed: 'Gagal menyimpan. Coba lagi.', invalid: 'Gambar ini tidak dapat diproses. Pilih foto PNG atau JPG yang dapat dibuka lalu coba lagi.' },
  pt: { title: 'Meu perfil', back: 'Voltar aos ganhos', nickname: 'Apelido', avatar: 'Foto de perfil', avatarHint: 'Escolha uma imagem PNG ou JPG. Fotos grandes são redimensionadas e comprimidas automaticamente.', save: 'Salvar apelido', saving: 'Salvando…', saved: 'Salvo sem revisão', upload: 'Enviar foto', loading: 'Carregando…', failed: 'Não foi possível salvar. Tente novamente.', invalid: 'Não foi possível processar esta imagem. Escolha uma foto PNG ou JPG válida e tente novamente.' },
} as const

function PublicProfilePage() {
  const [session] = useState<SessionState | null>(() => loadJsonState<SessionState>(STORAGE_KEY))
  const [locale] = useState<ConsumerLocale>(() => loadExternalLocale())
  const [profile, setProfile] = useState<UserPublicProfileResponse | null>(null)
  const [nickname, setNickname] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const copy = consumerProfileCopy[locale]

  useEffect(() => {
    if (!session) return
    let active = true
    void getUserPublicProfile(session.userId, session.accessToken)
      .then((value) => { if (active) { setProfile(value); setNickname(value.nickname || '') } })
      .catch(() => { if (active) setError(copy.failed) })
    return () => { active = false }
  }, [session, copy.failed])

  async function saveNickname(event: FormEvent) {
    event.preventDefault()
    if (!session || busy) return
    setBusy(true); setError(''); setMessage('')
    try { setProfile(await updateUserNickname(session.userId, session.accessToken, nickname)); setMessage(copy.saved) }
    catch { setError(copy.failed) }
    finally { setBusy(false) }
  }

  async function uploadAvatar(file?: File) {
    if (!session || !file) return
    setBusy(true); setError(''); setMessage('')
    try {
      const dataUrl = await prepareAvatarDataUrl(file)
      setProfile(await updateUserAvatar(session.userId, session.accessToken, dataUrl))
      setMessage(copy.saved)
    } catch (error) { setError(isAvatarValidationError(error) ? copy.invalid : copy.failed) }
    finally { setBusy(false) }
  }

  return <div className="consumer-app-page"><main className="consumer-shell consumer-form-shell">
    <header className="consumer-topbar"><a className="consumer-brand" href="/earnings">BANDEIRA</a></header>
    <a className="consumer-detail-back" href="/earnings">← {copy.back}</a>
    <section className="consumer-commercial-heading"><h1>{copy.title}</h1></section>
    {!session ? <a className="consumer-primary-link" href="/invite#phone-login">{consumerAccountCopy[locale].signIn}</a> :
      <section className="consumer-settings-card consumer-profile-card">
        <div className="consumer-profile-avatar">{profile?.avatarDataUrl ? <img src={profile.avatarDataUrl} alt="" /> : <User weight="fill" aria-hidden="true" />}</div>
        <label className="consumer-profile-upload">{copy.upload}<input type="file" accept="image/png,image/jpeg" disabled={busy} onChange={(event) => { void uploadAvatar(event.target.files?.[0]); event.target.value = '' }} /></label>
        <p>{copy.avatarHint}</p>
        <form onSubmit={(event) => { void saveNickname(event) }}><label className="consumer-field"><span>{copy.nickname}</span><input value={nickname} maxLength={40} onChange={(event) => setNickname(event.target.value)} required /></label><button className="consumer-form-submit" type="submit" disabled={busy || !nickname.trim()}>{busy ? copy.saving : copy.save}</button></form>
        {message ? <p role="status" className="consumer-profile-success">{message}</p> : null}
        {error ? <p role="alert" className="consumer-banner is-error">{error}</p> : null}
      </section>}
    {session ? <ConsumerBottomNavigation locale={locale} active="account" /> : null}
  </main></div>
}

function TimoBindingPage() {
  const [session] = useState<SessionState | null>(() => loadJsonState<SessionState>(STORAGE_KEY))
  const [locale, setLocale] = useState<ConsumerLocale>(() => loadExternalLocale())
  const [timoId, setTimoId] = useState('')
  const [binding, setBinding] = useState<PlatformBindingResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const copy = timoBindingCopy[locale]

  useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem(EXTERNAL_LOCALE_KEY, locale)
  }, [locale])

  useEffect(() => {
    if (!session) return
    let active = true
    void getPlatformBinding(session.userId, session.accessToken, 'TIMO')
      .then((value) => { if (active) { setBinding(value); setTimoId(value.platformUserId) } })
      .catch((err) => {
        const message = err instanceof Error ? err.message.toLowerCase() : ''
        if (active && !message.includes('platform binding not found')) setError(localizeTimoBindingError(message, locale))
      })
    return () => { active = false }
  }, [session, locale])

  useEffect(() => {
    if (!success) return undefined
    const timer = window.setTimeout(() => setSuccess(''), 5000)
    return () => window.clearTimeout(timer)
  }, [success])

  async function verifyCurrentBinding(current: PlatformBindingResponse) {
    if (!session) return
    try {
      const verified = await verifyPlatformBinding(session.userId, session.accessToken, 'TIMO')
      setBinding(verified)
      if (verified.status === 'VERIFIED') setSuccess(copy.verified)
      else if (verified.status === 'REJECTED') setError(verified.verificationState === 'ERROR' ? timoHelpCopy[locale].technical
        : localizeTimoBindingError(verified.rejectionCode || verified.rejectionReason || '', locale))
      else setSuccess(timoPendingState(verified, locale))
    } catch (err) {
      setBinding(current)
      const message = err instanceof Error ? err.message.toLowerCase() : ''
      if (message.includes('no enabled local mock verification record')) setSuccess(copy.pending)
      else if (message.includes('mcn verification client is not configured')) setSuccess(copy.pending)
      else setError(localizeTimoBindingError(message, locale))
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session || !/^[1-9][0-9]{11}$/.test(timoId)) return
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const submitted = await submitPlatformBinding(session.userId, session.accessToken, { platformCode: 'TIMO', platformUserId: timoId })
      setBinding(submitted)
      setSuccess(copy.submitted)
      await verifyCurrentBinding(submitted)
    } catch (err) {
      setError(localizeTimoBindingError(err instanceof Error ? err.message : '', locale))
    } finally {
      setLoading(false)
    }
  }

  async function handleRetryVerification() {
    if (!binding || !session) return
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      await verifyCurrentBinding(binding)
    } finally {
      setLoading(false)
    }
  }

  const isVerified = binding?.status === 'VERIFIED'
  const isRejected = binding?.status === 'REJECTED'
  const isTechnicalRejection = isRejected && binding?.verificationState === 'ERROR'

  return (
    <div className="consumer-app-page">
      <main className="consumer-shell consumer-form-shell">
        <header className="consumer-topbar">
          <a className="consumer-brand" href="/earnings"><img className="consumer-brand-logo" src="/bandeira-logo-v1.png" alt="" />BANDEIRA</a>
          <div className="consumer-topbar-actions">
            <select className="consumer-language" aria-label={externalPageCopyByLocale[locale].languageLabel} value={locale} onChange={(event) => setLocale(event.target.value as ConsumerLocale)}><option value="zh">中文</option><option value="en">EN</option><option value="es">ES</option><option value="id">ID</option><option value="pt">PT</option></select>
            {session ? <ConsumerAccountLink locale={locale} /> : null}
          </div>
        </header>

        {session ? <>
          <h1 className="consumer-bind-title">{copy.title}</h1>
          {error ? <div className="consumer-banner is-error" role="alert">{error}</div> : null}
          {!error && success ? <div className="consumer-banner is-success" role="status"><CheckCircle size={20} weight="fill" />{success}</div> : null}
          <section className="consumer-form-card">
            <div className="consumer-form-card-heading"><div><h2>{copy.account}</h2><p>{timoHelpCopy[locale].findId}</p></div><IdentificationCard size={28} weight="duotone" /></div>
            {isVerified ? <div className="consumer-form-note"><CheckCircle size={20} weight="fill" />{copy.verified}<br />Timo ID · {binding?.platformUserId}</div> : !binding ? (
              <form onSubmit={handleSubmit}>
                <label className="consumer-field"><span>{copy.account}</span><input required value={timoId} onChange={(event) => setTimoId(event.target.value.replace(/\D/g, '').slice(0, 12))} placeholder={copy.placeholder} inputMode="numeric" autoComplete="off" pattern="[1-9][0-9]{11}" maxLength={12} /><small>{copy.hint}</small></label>
                <button className="consumer-form-submit" type="submit" disabled={loading || !/^[1-9][0-9]{11}$/.test(timoId)}>{loading ? copy.verifying : copy.submit}</button>
              </form>
            ) : null}
            {binding && !isVerified ? <div className="consumer-form-note"><strong>{isTechnicalRejection ? timoHelpCopy[locale].technical : isRejected ? copy.rejected : timoPendingState(binding, locale)}</strong><span>Timo ID · {binding.platformUserId}</span>{isRejected && !isTechnicalRejection && (binding.rejectionCode || binding.rejectionReason) ? <span>{localizeTimoBindingError(binding.rejectionCode || binding.rejectionReason || '', locale)}</span> : null}{isRejected ? <button className="consumer-secondary-link" type="button" onClick={() => void handleRetryVerification()} disabled={loading}>{loading ? copy.verifying : copy.verifyAgain}</button> : null}</div> : null}
          </section>
        </> : <section className="consumer-auth-gate"><div className="consumer-auth-icon"><LockSimple weight="duotone" aria-hidden="true" /></div><h1>{copy.signInTitle}</h1><p>{copy.signInHint}</p><a className="consumer-primary-link" href="/invite#phone-login">{copy.signIn}<ArrowRight weight="bold" aria-hidden="true" /></a></section>}
        {session ? <ConsumerBottomNavigation locale={locale} active="account" /> : null}
      </main>
    </div>
  )
}

const consumerWithdrawalCopy = {
  zh: { title: '管理收益提现', close: '关闭', when: '什么时候开放收益提现？', whenAnswer: '开放时间待定，以官方通知为准。', how: '收益如何发放？', howAnswer: '邀请奖励先计入积分账户，冻结 7 天后解冻；实际提现方式另行公布。' },
  en: { title: 'Manage earnings withdrawals', close: 'Close', when: 'When will withdrawals open?', whenAnswer: 'The launch date has not been set. Please follow official announcements.', how: 'How are earnings paid?', howAnswer: 'Invitation rewards first enter your points account and unlock after 7 days. Withdrawal methods will be announced separately.' },
  es: { title: 'Gestionar retiros de ganancias', close: 'Cerrar', when: '¿Cuándo estarán disponibles los retiros?', whenAnswer: 'La fecha aún no está definida. Consulta los anuncios oficiales.', how: '¿Cómo se pagan las ganancias?', howAnswer: 'Las recompensas por invitación entran primero en la cuenta de puntos y se liberan después de 7 días. El método de retiro se anunciará por separado.' },
  id: { title: 'Kelola penarikan penghasilan', close: 'Tutup', when: 'Kapan penarikan tersedia?', whenAnswer: 'Tanggalnya belum ditetapkan. Ikuti pengumuman resmi.', how: 'Bagaimana penghasilan dibayarkan?', howAnswer: 'Imbalan undangan masuk ke akun poin dan tersedia setelah 7 hari. Metode penarikan akan diumumkan terpisah.' },
  pt: { title: 'Gerenciar saques dos ganhos', close: 'Fechar', when: 'Quando os saques estarão disponíveis?', whenAnswer: 'A data ainda não foi definida. Acompanhe os anúncios oficiais.', how: 'Como os ganhos são pagos?', howAnswer: 'As recompensas por convite entram primeiro na conta de pontos e são liberadas após 7 dias. O método de saque será anunciado separadamente.' },
} as const

const teamLoadCopy: Record<ConsumerLocale, { failed: string; retry: string }> = {
  zh: { failed: '团队数据暂时无法读取，当前人数不能按 0 计算。', retry: '重试' },
  en: { failed: 'Team data is temporarily unavailable. The count is not zero.', retry: 'Retry' },
  es: { failed: 'Los datos del equipo no están disponibles; el número no es cero.', retry: 'Reintentar' },
  id: { failed: 'Data tim sementara tidak tersedia; jumlahnya bukan nol.', retry: 'Coba lagi' },
  pt: { failed: 'Os dados da equipe estão indisponíveis; a contagem não é zero.', retry: 'Tentar novamente' },
}

function EarningsPage({ view = 'overview' }: { view?: 'overview' | 'effective' | 'activity' }) {
  const [session, setSession] = useState<SessionState | null>(() => loadJsonState<SessionState>(STORAGE_KEY))
  const [locale, setLocale] = useState<keyof typeof externalPageCopyByLocale>(() => loadExternalLocale())
  const [home, setHome] = useState<DistributionHomeResponse | null>(null)
  const [team, setTeam] = useState<EffectiveTeamResponse | null>(null)
  const [teamError, setTeamError] = useState(false)
  const [teamReload, setTeamReload] = useState(0)
  const [wallet, setWallet] = useState<InvitationRewardAccountResponse | null>(null)
  const [profile, setProfile] = useState<UserPublicProfileResponse | null>(null)
  const [selectedPlatform, setSelectedPlatform] = useState<'TIMO' | 'LINKY' | null>(null)
  const [selectedPlatformVerified, setSelectedPlatformVerified] = useState(false)
  const [workspaceLoaded, setWorkspaceLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showBalance, setShowBalance] = useState(true)
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false)
  const withdrawalCopy = consumerWithdrawalCopy[locale]
  const copy = externalPageCopyByLocale[locale]
  const walletCopy = {
    zh: {
      available: '本应用已解冻积分', frozen: '本应用冻结中', total: '本应用奖励净额', withdraw: '管理收益提现', income: '邀请奖励', direct: '直接邀请奖励', indirect: '间接邀请奖励', release: '到期解冻', revision: '收入修订', records: '应用奖励流水', sourceUser: '来自用户', unit: '积分', diamondUnit: '钻石',
      signIn: '登录', greeting: '早上好，伙伴！', greetingSubtitle: '每一次有效邀请，都在积累你的收入。', notificationLabel: '查看奖励记录', hideBalance: '隐藏余额', showBalance: '显示余额',
      growthTitle: '新星邀请人', growthBefore: '再邀请 ', growthAfter: ' 位有效用户，即可完成本阶段目标', growthDone: '本阶段目标已完成，继续保持增长',
      inviteOverview: '邀请概览（本周）', invitedUsers: '已邀请用户', actionsTitle: '今天怎么推进收益', actionsCount: '4 个关键动作',
      inviteAction: '邀请新用户', invitedCount: (count: number) => `当前已邀请 ${count} 人`, goInvite: '去邀请', bindAction: '完成平台绑定', bindHint: '登记并验证 Timo / Linky ID', goBind: '去绑定',
      followAction: '跟进有效用户', effectiveCount: (count: number) => `已达标有效用户 ${count} 人`, viewTeam: '查看团队', recordsCount: (count: number) => `${count} 条`, viewRecords: '查看记录', allRecords: '全部记录',
      teamOverview: '团队概览', peopleCount: (count: number) => `${count} 人`, firstLevel: '一级用户', secondLevel: '二级用户', thirdLevel: '三级用户', weeklyTeamIncome: '团队本周收入', loadMore: '加载更多流水',
      loadFailure: '收益加载失败，请稍后重试。', sessionExpired: '登录状态已过期，请重新登录。', activityLoadFailure: '账户流水加载失败，请稍后重试。',
    },
    en: {
      available: 'App unlocked points', frozen: 'App frozen points', total: 'App reward balance', withdraw: 'Manage earnings withdrawals', income: 'Invitation income', direct: 'Direct invitation income', indirect: 'Indirect invitation income', release: 'Unlocked', revision: 'Income adjustment', records: 'App reward activity', sourceUser: 'From user', unit: 'points', diamondUnit: 'diamonds',
      signIn: 'Sign in', greeting: 'Good morning, partner!', greetingSubtitle: 'Every eligible invitation helps your earnings grow.', notificationLabel: 'View reward activity', hideBalance: 'Hide balance', showBalance: 'Show balance',
      growthTitle: 'Rising Star inviter', growthBefore: 'Invite ', growthAfter: ' more eligible users to reach this stage’s goal', growthDone: 'Stage goal reached. Keep growing!',
      inviteOverview: 'Invitation overview (this week)', invitedUsers: 'Users invited', actionsTitle: 'Grow your earnings today', actionsCount: '4 key actions',
      inviteAction: 'Invite new users', invitedCount: (count: number) => `${count} users invited so far`, goInvite: 'Invite now', bindAction: 'Bind platform accounts', bindHint: 'Register and verify your Timo / Linky ID', goBind: 'Bind now',
      followAction: 'Follow up with eligible users', effectiveCount: (count: number) => `${count} qualified users`, viewTeam: 'View team', recordsCount: (count: number) => `${count} records`, viewRecords: 'View records', allRecords: 'All records',
      teamOverview: 'Team overview', peopleCount: (count: number) => `${count} people`, firstLevel: 'Direct users', secondLevel: 'Second-level users', thirdLevel: 'Third-level users', weeklyTeamIncome: 'Team income this week', loadMore: 'Load more activity',
      loadFailure: 'Could not load earnings. Try again later.', sessionExpired: 'Your session has expired. Sign in again.', activityLoadFailure: 'Could not load account activity. Try again later.',
    },
    es: {
      available: 'Puntos liberados de la app', frozen: 'Congelados de la app', total: 'Saldo de recompensas de la app', withdraw: 'Gestionar retiros', income: 'Ingreso por invitación', direct: 'Invitación directa', indirect: 'Invitación indirecta', release: 'Liberados', revision: 'Ajuste de ingresos', records: 'Movimientos de la app', sourceUser: 'Del usuario', unit: 'puntos', diamondUnit: 'diamantes',
      signIn: 'Iniciar sesión', greeting: '¡Buenos días!', greetingSubtitle: 'Cada invitación válida ayuda a aumentar tus ingresos.', notificationLabel: 'Ver movimientos de recompensas', hideBalance: 'Ocultar saldo', showBalance: 'Mostrar saldo',
      growthTitle: 'Invitador Nueva Estrella', growthBefore: 'Invita a ', growthAfter: ' usuarios válidos más para alcanzar la meta de esta etapa', growthDone: '¡Meta alcanzada! Sigue creciendo.',
      inviteOverview: 'Resumen de invitaciones (esta semana)', invitedUsers: 'Usuarios invitados', actionsTitle: 'Impulsa tus ingresos hoy', actionsCount: '4 acciones clave',
      inviteAction: 'Invitar a nuevos usuarios', invitedCount: (count: number) => `${count} usuarios invitados hasta ahora`, goInvite: 'Invitar', bindAction: 'Vincular cuentas de plataforma', bindHint: 'Registra y verifica tu ID de Timo / Linky', goBind: 'Vincular',
      followAction: 'Dar seguimiento a usuarios válidos', effectiveCount: (count: number) => `${count} usuarios calificados`, viewTeam: 'Ver equipo', recordsCount: (count: number) => `${count} registros`, viewRecords: 'Ver registros', allRecords: 'Todos los registros',
      teamOverview: 'Resumen del equipo', peopleCount: (count: number) => `${count} personas`, firstLevel: 'Usuarios directos', secondLevel: 'Usuarios de segundo nivel', thirdLevel: 'Usuarios de tercer nivel', weeklyTeamIncome: 'Ingresos del equipo esta semana', loadMore: 'Cargar más movimientos',
      loadFailure: 'No se pudieron cargar los ingresos. Inténtalo más tarde.', sessionExpired: 'Tu sesión caducó. Inicia sesión de nuevo.', activityLoadFailure: 'No se pudieron cargar los movimientos. Inténtalo más tarde.',
    },
    id: {
      available: 'Poin tersedia aplikasi', frozen: 'Poin dibekukan aplikasi', total: 'Saldo imbalan aplikasi', withdraw: 'Kelola penarikan', income: 'Pendapatan undangan', direct: 'Undangan langsung', indirect: 'Undangan tidak langsung', release: 'Dibuka', revision: 'Penyesuaian pendapatan', records: 'Riwayat imbalan aplikasi', sourceUser: 'Dari pengguna', unit: 'poin', diamondUnit: 'berlian',
      signIn: 'Masuk', greeting: 'Selamat pagi!', greetingSubtitle: 'Setiap undangan yang valid membantu meningkatkan penghasilanmu.', notificationLabel: 'Lihat riwayat imbalan', hideBalance: 'Sembunyikan saldo', showBalance: 'Tampilkan saldo',
      growthTitle: 'Pengundang Bintang Baru', growthBefore: 'Undang ', growthAfter: ' pengguna valid lagi untuk mencapai target tahap ini', growthDone: 'Target tahap ini tercapai. Terus berkembang!',
      inviteOverview: 'Ringkasan undangan (minggu ini)', invitedUsers: 'Pengguna yang diundang', actionsTitle: 'Tingkatkan penghasilan hari ini', actionsCount: '4 tindakan utama',
      inviteAction: 'Undang pengguna baru', invitedCount: (count: number) => `${count} pengguna sudah diundang`, goInvite: 'Undang', bindAction: 'Hubungkan akun platform', bindHint: 'Daftarkan dan verifikasi ID Timo / Linky', goBind: 'Hubungkan',
      followAction: 'Tindak lanjuti pengguna valid', effectiveCount: (count: number) => `${count} pengguna yang memenuhi syarat`, viewTeam: 'Lihat tim', recordsCount: (count: number) => `${count} catatan`, viewRecords: 'Lihat riwayat', allRecords: 'Semua catatan',
      teamOverview: 'Ringkasan tim', peopleCount: (count: number) => `${count} orang`, firstLevel: 'Pengguna langsung', secondLevel: 'Pengguna tingkat kedua', thirdLevel: 'Pengguna tingkat ketiga', weeklyTeamIncome: 'Pendapatan tim minggu ini', loadMore: 'Muat riwayat lainnya',
      loadFailure: 'Penghasilan tidak dapat dimuat. Coba lagi nanti.', sessionExpired: 'Sesi kamu sudah berakhir. Masuk lagi.', activityLoadFailure: 'Riwayat akun tidak dapat dimuat. Coba lagi nanti.',
    },
    pt: {
      available: 'Pontos liberados do app', frozen: 'Congelados do app', total: 'Saldo de recompensas do app', withdraw: 'Gerenciar saques', income: 'Receita por convite', direct: 'Convite direto', indirect: 'Convite indireto', release: 'Liberados', revision: 'Ajuste de receita', records: 'Movimentações do app', sourceUser: 'Do usuário', unit: 'pontos', diamondUnit: 'diamantes',
      signIn: 'Entrar', greeting: 'Bom dia!', greetingSubtitle: 'Cada convite válido ajuda a aumentar seus ganhos.', notificationLabel: 'Ver movimentações de recompensas', hideBalance: 'Ocultar saldo', showBalance: 'Mostrar saldo',
      growthTitle: 'Convidador Nova Estrela', growthBefore: 'Convide mais ', growthAfter: ' usuários válidos para atingir a meta desta etapa', growthDone: 'Meta desta etapa atingida. Continue crescendo!',
      inviteOverview: 'Visão geral dos convites (esta semana)', invitedUsers: 'Usuários convidados', actionsTitle: 'Como aumentar seus ganhos hoje', actionsCount: '4 ações importantes',
      inviteAction: 'Convidar novos usuários', invitedCount: (count: number) => `${count} usuários convidados até agora`, goInvite: 'Convidar', bindAction: 'Vincular contas da plataforma', bindHint: 'Cadastre e valide seu ID Timo / Linky', goBind: 'Vincular',
      followAction: 'Acompanhar usuários válidos', effectiveCount: (count: number) => `${count} usuários qualificados`, viewTeam: 'Ver equipe', recordsCount: (count: number) => `${count} registros`, viewRecords: 'Ver registros', allRecords: 'Todos os registros',
      teamOverview: 'Visão geral da equipe', peopleCount: (count: number) => `${count} pessoas`, firstLevel: 'Usuários diretos', secondLevel: 'Usuários do segundo nível', thirdLevel: 'Usuários do terceiro nível', weeklyTeamIncome: 'Receita da equipe nesta semana', loadMore: 'Carregar mais movimentações',
      loadFailure: 'Não foi possível carregar os ganhos. Tente novamente mais tarde.', sessionExpired: 'Sua sessão expirou. Entre novamente.', activityLoadFailure: 'Não foi possível carregar as movimentações da conta. Tente novamente mais tarde.',
    },
  }[locale]

  useEffect(() => {
    if (!withdrawalDialogOpen) return
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setWithdrawalDialogOpen(false) }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [withdrawalDialogOpen])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(EXTERNAL_LOCALE_KEY, locale)
    }
  }, [locale])

  useEffect(() => {
    async function loadData() {
      if (!session) return
      setLoading(true)
      setError('')
      try {
        const workspace = await getConsumerWorkspace(session.userId, session.accessToken)
        setWorkspaceLoaded(true)
        if (!workspace.selected) { setSelectedPlatform(null); return }
        const platformCode = workspace.selected
        setSelectedPlatform(platformCode)
        const verified = workspace.apps.some((app) => app.code === platformCode && app.verified)
        setSelectedPlatformVerified(verified)
        if (!verified) return
        const [homeData, teamData, walletData, profileData] = await Promise.all([
          getDistributionHome(session.userId, session.accessToken, platformCode),
          getDistributionEffectiveTeam(session.userId, session.accessToken, platformCode).catch(() => { setTeamError(true); return null }),
          getDistributionInvitationAccount(session.userId, session.accessToken, 0, 20, platformCode),
          getUserPublicProfile(session.userId, session.accessToken).catch(() => null),
        ])
        setHome(homeData)
        setTeam(teamData)
        if (teamData) setTeamError(false)
        setWallet(walletData)
        setProfile(profileData)
      } catch (err) {
        const message = err instanceof Error ? err.message : ''
        if (/access denied|unauthorized|session/i.test(message)) {
          window.localStorage.removeItem(STORAGE_KEY)
          setSession(null)
          setError(walletCopy.sessionExpired)
        } else {
          setError(walletCopy.loadFailure)
        }
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [session, view, teamReload, walletCopy.loadFailure, walletCopy.sessionExpired])

  async function loadMoreWallet() {
    if (!session || !selectedPlatform || !wallet || wallet.items.length >= wallet.totalRecords) return
    setLoading(true)
    setError('')
    try {
      const next = await getDistributionInvitationAccount(session.userId, session.accessToken, wallet.page + 1, wallet.size, selectedPlatform)
      setWallet({ ...next, items: [...wallet.items, ...next.items] })
    } catch {
      setError(walletCopy.activityLoadFailure)
    } finally {
      setLoading(false)
    }
  }

  const rewardItems = wallet?.items ?? []

  function getRewardActivityTitle(level?: number | null) {
    return level === 1 ? walletCopy.direct : walletCopy.indirect
  }

  function formatRewardDate(value?: string) {
    if (!value) return '--'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : locale, {
      month: 'short',
      day: 'numeric',
    }).format(date)
  }

  const availableReward = wallet?.availablePoints ?? 0
  const totalReward = wallet?.totalPoints ?? 0
  const frozenReward = wallet?.frozenPoints ?? 0
  const effectiveUsersThisView = effectiveTeamCount(team, teamError)
  const growthTarget = 10
  const growthProgress = Math.min(100, Math.round(((effectiveUsersThisView ?? 0) / growthTarget) * 100))
  const growthRemaining = Math.max(0, growthTarget - (effectiveUsersThisView ?? 0))

  if (session && workspaceLoaded && !selectedPlatform) {
    return <div className="consumer-app-page"><main className="consumer-shell consumer-detail-page">
      <header className="consumer-topbar"><a className="consumer-brand" href="/earnings"><img className="consumer-brand-logo" src="/bandeira-logo-v1.png" alt="" />BANDEIRA</a><ConsumerAccountLink locale={locale} /></header>
      <ConsumerUnboundGuidance locale={locale} variant="gate" />
      <ConsumerBottomNavigation locale={locale} active="earnings" />
    </main></div>
  }

  if (session && selectedPlatform && !selectedPlatformVerified) {
    const appName = consumerAppName(selectedPlatform)
    return <div className="consumer-app-page"><main className="consumer-shell consumer-detail-page">
      <header className="consumer-topbar"><a className="consumer-brand" href="/earnings"><img className="consumer-brand-logo" src="/bandeira-logo-v1.png" alt="" />BANDEIRA</a><ConsumerAccountLink locale={locale} /></header>
      <div className="consumer-workspace-banner"><strong>{appName}</strong><span>{workspaceCopy[locale].bannerDescription(appName)}</span><a href="/account">{workspaceCopy[locale].switchOtherApp}</a></div>
      <section className="consumer-auth-gate"><div className="consumer-auth-icon"><LinkSimple weight="duotone" aria-hidden="true" /></div><h1>{workspaceCopy[locale].emptyTitle(appName)}</h1><p>{workspaceCopy[locale].emptyHint(appName)}</p><a className="consumer-primary-link" href={selectedPlatform === 'TIMO' ? '/account/timo' : '/account/linky'}>{workspaceCopy[locale].bind}<ArrowRight weight="bold" aria-hidden="true" /></a></section>
      <ConsumerBottomNavigation locale={locale} active="earnings" />
    </main></div>
  }

  if (view !== 'overview') {
    const detailTitle = view === 'effective' ? walletCopy.followAction : walletCopy.records
    return <div className="consumer-app-page"><main className="consumer-shell consumer-detail-page">
      <header className="consumer-topbar"><a className="consumer-brand" href="/earnings">BANDEIRA</a></header>
      <a className="consumer-detail-back" href="/earnings">← {consumerNavigationCopy[locale].earnings}</a>
      <section className="consumer-commercial-heading"><h1>{detailTitle}</h1></section>
      {selectedPlatform ? <p className="consumer-workspace-banner">{workspaceCopy[locale].appSummary(consumerAppName(selectedPlatform))}</p> : null}
      {error ? <div className="consumer-banner is-error" role="alert">{error}</div> : null}
      {!session ? <a className="consumer-primary-link" href="/invite#phone-login">{walletCopy.signIn}</a> :
        view === 'effective' ? <section className="consumer-settings-card">
          <h2>{teamError ? teamLoadCopy[locale].failed : effectiveUsersThisView === null ? copy.loading : walletCopy.effectiveCount(effectiveUsersThisView)}</h2>
          <p>{walletCopy.teamOverview}</p>
          {teamError ? <button type="button" onClick={() => setTeamReload((value) => value + 1)}>{teamLoadCopy[locale].retry}</button> : null}
          {loading ? <p>{copy.loading}</p> : teamError ? null : team?.items.length ?
            <div className="consumer-detail-member-list">{team.items.map((item) =>
              <div key={`${item.level}-${item.userId}`}><strong>#{item.userId}</strong><span>{item.level === 1 ? walletCopy.firstLevel : item.level === 2 ? walletCopy.secondLevel : walletCopy.thirdLevel} · {consumerCountryName(item.countryCode, locale)}</span></div>)}</div> :
            <div className="consumer-empty-state"><UsersThree weight="duotone" aria-hidden="true" /><p>{walletCopy.effectiveCount(0)}</p></div>}
        </section> : <section className="consumer-settings-card">
          <h2>{walletCopy.recordsCount(wallet?.totalRecords ?? 0)}</h2>
          <div className="consumer-detail-grid">
            <div><span>{walletCopy.income}</span><strong>{formatMoney(wallet?.cumulativeIncomePoints, locale)} {walletCopy.unit}</strong></div>
            <div><span>{walletCopy.frozen}</span><strong>{formatMoney(frozenReward, locale)} {walletCopy.unit}</strong></div>
            <div><span>{walletCopy.available}</span><strong>{formatMoney(availableReward, locale)} {walletCopy.unit}</strong></div>
          </div>
          {rewardItems.length ? <div className="consumer-withdraw-list">{rewardItems.map((item) =>
            <div key={item.id}><span>{item.type === 'UNFREEZE' ? walletCopy.release : item.type === 'MCN_REVISION' ? walletCopy.revision : getRewardActivityTitle(item.rewardLevel)}<small>{item.platformCode} · {formatMoney(item.rewardDiamonds, locale)} {walletCopy.diamondUnit} · {formatRewardDate(item.recordedAt)}</small></span><strong>{formatMoney(item.type === 'UNFREEZE' ? item.availableDelta : item.frozenDelta + item.availableDelta, locale)} {walletCopy.unit}</strong></div>)}</div> :
            <div className="consumer-empty-state"><Wallet weight="duotone" aria-hidden="true" /><p>{copy.emptyRewardsTitle}</p></div>}
          {wallet && wallet.items.length < wallet.totalRecords ? <button className="consumer-detail-load-more" type="button" onClick={() => void loadMoreWallet()} disabled={loading}>{loading ? copy.loading : walletCopy.loadMore}</button> : null}
        </section>}
      {view === 'effective' && selectedPlatform && session ? <InvitationProgressPanel userId={session.userId} accessToken={session.accessToken} locale={locale} initialPlatform={selectedPlatform} allowSwitch={false} /> : null}
      {session ? <ConsumerBottomNavigation locale={locale} active="earnings" /> : null}
    </main></div>
  }

  return (
    <div className="consumer-app-page">
      <main className="consumer-shell">
        <header className="consumer-topbar">
          <a className="consumer-brand" href="/earnings"><img className="consumer-brand-logo" src="/bandeira-logo-v1.png" alt="" />BANDEIRA</a>
          <div className="consumer-topbar-actions">
            {!session ? (
              <select className="consumer-language" aria-label={copy.languageLabel} value={locale} onChange={(event) => setLocale(event.target.value as keyof typeof externalPageCopyByLocale)}>
                <option value="zh">中文</option>
                <option value="en">EN</option>
                <option value="es">ES</option>
                <option value="id">ID</option>
                <option value="pt">PT</option>
              </select>
            ) : null}
            {session ? <ConsumerAccountLink locale={locale} /> : <a className="consumer-account-link" href="/invite#phone-login"><UserCircle weight="regular" aria-hidden="true" /><span>{walletCopy.signIn}</span><CaretRight weight="bold" aria-hidden="true" /></a>}
          </div>
        </header>

        {error ? <div className="consumer-banner is-error" role="alert">{error}</div> : null}
        {selectedPlatform ? <div className="consumer-workspace-banner"><strong>{consumerAppName(selectedPlatform)}</strong><span>{workspaceCopy[locale].bannerDescription(consumerAppName(selectedPlatform))}</span><a href="/account">{workspaceCopy[locale].switchOtherApp}</a></div> : null}

        {!session ? (
          <section className="consumer-auth-gate">
            <div className="consumer-auth-icon"><Wallet weight="duotone" aria-hidden="true" /></div>
            <p className="consumer-eyebrow">{copy.earningsOverview}</p>
            <h1>{copy.noSessionTitle}</h1>
            <p>{copy.noSessionHint}</p>
            <a className="consumer-primary-link" href="/invite#phone-login">
              {copy.noSessionPrimary}<ArrowRight weight="bold" aria-hidden="true" />
            </a>
          </section>
        ) : (
          <>
            <div className="consumer-home-greeting">
              <h1 className="consumer-visually-hidden">{copy.earningsTitle}</h1>
              <a className="consumer-home-profile-link" href="/account/profile" aria-label={consumerProfileCopy[locale].title}>
                <span className="consumer-home-avatar">{profile?.avatarDataUrl ? <img src={profile.avatarDataUrl} alt="" /> : <User weight="fill" aria-hidden="true" />}</span>
                <span className="consumer-home-profile-copy"><strong>{profile?.nickname || walletCopy.greeting}</strong><span>{walletCopy.greetingSubtitle}</span></span>
              </a>
              <a className="consumer-notification-link" href="/earnings/activity" aria-label={walletCopy.notificationLabel}><Bell weight="regular" aria-hidden="true" /><i /></a>
            </div>

            <section className="consumer-balance-card" aria-label={walletCopy.available}>
              <div className="consumer-balance-top">
                <div className="consumer-balance-label">
                  <span>{walletCopy.available}</span>
                  <button type="button" className="consumer-icon-button" onClick={() => setShowBalance((value) => !value)} aria-label={showBalance ? walletCopy.hideBalance : walletCopy.showBalance}>
                    {showBalance ? <Eye weight="regular" aria-hidden="true" /> : <EyeSlash weight="regular" aria-hidden="true" />}
                  </button>
                </div>
                <button className="consumer-hero-withdraw" type="button" onClick={() => setWithdrawalDialogOpen(true)}>{withdrawalCopy.title}</button>
              </div>
              <div className="consumer-balance-value">
                <strong>{showBalance ? formatMoney(availableReward, locale) : '••••••'} {walletCopy.unit}</strong>
              </div>
              <div className="consumer-balance-metrics">
                <div>
                  <span>{walletCopy.frozen}</span>
                  <strong>{showBalance ? formatMoney(frozenReward, locale) : '••••'}</strong>
                </div>
                <div>
                  <span>{walletCopy.total}</span>
                  <strong>{showBalance ? formatMoney(totalReward, locale) : '••••'}</strong>
                </div>
                <div>
                  <span>{walletCopy.income}</span>
                  <strong>{showBalance ? formatMoney(wallet?.cumulativeIncomePoints, locale) : '••••'}</strong>
                </div>
                <div>
                  <span>{copy.effectiveUsers}</span>
                  <strong>{effectiveUsersThisView ?? '—'}</strong>
                </div>
              </div>
            </section>

            <a className="consumer-growth-card" href="/earnings/effective-users">
              <span className="consumer-growth-medal"><Medal weight="duotone" aria-hidden="true" /></span>
              <span className="consumer-growth-copy">
                <span><strong>{walletCopy.growthTitle}</strong><b>{effectiveUsersThisView ?? '—'}<small>/{growthTarget}</small></b></span>
                {effectiveUsersThisView !== null ? <i><em style={{ width: `${growthProgress}%` }} /></i> : null}
                <small>{teamError ? teamLoadCopy[locale].failed : effectiveUsersThisView === null ? copy.loading : growthRemaining > 0 ? <>{walletCopy.growthBefore}<strong>{growthRemaining}</strong>{walletCopy.growthAfter}</> : walletCopy.growthDone}</small>
              </span>
              <CaretRight weight="bold" aria-hidden="true" />
            </a>

            <a className="consumer-commission-entry" href="/earnings/commission">
              <span><strong>{commissionReportCopy[locale].title}</strong><small>{commissionReportCopy[locale].entryHint}</small></span>
              <CaretRight weight="bold" aria-hidden="true" />
            </a>

            <section className="consumer-task-section">
              <div className="consumer-section-head consumer-task-head">
                <h2><Target weight="fill" aria-hidden="true" />{walletCopy.actionsTitle}</h2>
                <span>{walletCopy.actionsCount}</span>
              </div>

              <div className="consumer-task-list">
                <a href="/invite"><span className="is-orange"><UserPlus weight="fill" /></span><div><strong>{walletCopy.inviteAction}</strong><small>{walletCopy.invitedCount(home?.directInvitedUsers ?? 0)}</small></div><b>{walletCopy.goInvite}</b></a>
                <a href="/account"><span className="is-pink"><LinkSimple weight="bold" /></span><div><strong>{walletCopy.bindAction}</strong><small>{walletCopy.bindHint}</small></div><b>{walletCopy.goBind}</b></a>
                <a href="/earnings/effective-users"><span className="is-green"><UsersThree weight="fill" /></span><div><strong>{walletCopy.followAction}</strong><small>{teamError ? teamLoadCopy[locale].failed : effectiveUsersThisView === null ? copy.loading : walletCopy.effectiveCount(effectiveUsersThisView)}</small></div><b>{walletCopy.viewTeam}</b></a>
                <a href="/earnings/activity"><span className="is-purple"><Sparkle weight="fill" /></span><div><strong>{walletCopy.records}</strong><small>{walletCopy.recordsCount(wallet?.totalRecords ?? 0)}</small></div><b>{walletCopy.viewRecords}</b></a>
              </div>
            </section>

            <section className="consumer-activity-section">
              <div className="consumer-section-head">
                <h2>{walletCopy.records}</h2>
                <a href="/earnings/activity">{walletCopy.allRecords}<CaretRight weight="bold" aria-hidden="true" /></a>
              </div>

              {loading ? (
                <div className="consumer-loading-list" aria-label={copy.loading}>
                  <span /><span /><span />
                </div>
              ) : rewardItems.length ? (
                <div className="consumer-activity-list">
                  {rewardItems.slice(0, 3).map((item) => {
                    const isAvailable = item.type === 'UNFREEZE'
                    const amount = item.type === 'UNFREEZE' ? item.availableDelta : item.frozenDelta + item.availableDelta
                    return (
                      <article className="consumer-activity-row" key={item.id}>
                        <span className={`consumer-activity-icon ${isAvailable ? 'is-available' : 'is-frozen'}`}>
                          {isAvailable ? <CheckCircle weight="fill" aria-hidden="true" /> : <LockSimple weight="fill" aria-hidden="true" />}
                        </span>
                        <div className="consumer-activity-copy">
                          <strong>{item.type === 'UNFREEZE' ? walletCopy.release : item.type === 'MCN_REVISION' ? walletCopy.revision : getRewardActivityTitle(item.rewardLevel)}</strong>
                          <span>{item.platformCode} · {walletCopy.sourceUser} #{item.sourceUserId}</span>
                        </div>
                        <div className={`consumer-activity-amount ${isAvailable ? 'is-available' : 'is-frozen'}`}>
                          <strong>{amount > 0 ? '+' : ''}{formatMoney(amount, locale)} {walletCopy.unit}</strong>
                          <span>{item.type === 'UNFREEZE' ? walletCopy.available : item.type === 'MCN_REVISION' ? walletCopy.revision : walletCopy.frozen} · {formatRewardDate(item.recordedAt)}</span>
                        </div>
                      </article>
                    )
                  })}
                </div>
              ) : (
                <div className="consumer-empty-state">
                  <UserPlus weight="duotone" aria-hidden="true" />
                  <div><strong>{copy.emptyRewardsTitle}</strong><p>{copy.emptyRewardsHint}</p></div>
                  <a href="/invite">{copy.emptyRewardsAction}</a>
                </div>
              )}
            </section>

            {withdrawalDialogOpen ? <div className="consumer-modal-backdrop" onClick={() => setWithdrawalDialogOpen(false)}>
              <section className="consumer-withdrawal-dialog" role="dialog" aria-modal="true" aria-label={withdrawalCopy.title} onClick={(event) => event.stopPropagation()}>
                <h2>{withdrawalCopy.title}</h2>
                <h3>{withdrawalCopy.when}</h3><p>{withdrawalCopy.whenAnswer}</p>
                <h3>{withdrawalCopy.how}</h3><p>{withdrawalCopy.howAnswer}</p>
                <button type="button" autoFocus onClick={() => setWithdrawalDialogOpen(false)}>{withdrawalCopy.close}</button>
              </section>
            </div> : null}
          </>
        )}

        {session ? <ConsumerBottomNavigation locale={locale} active="earnings" /> : null}
      </main>
    </div>
  )
}

const commissionReportCopy = {
  zh: { title: '分佣收益明细', entryHint: '按直接下级查看其邀请链给你的分佣', yesterday: '昨日', recent: (days: number) => `最近${days}日`, custom: '自定义', start: '开始日期', end: '结束日期', direct: '直接分佣', indirect: '间接分佣', total: '分佣总计', source: '贡献用户', period: '统计周期（UTC0）', points: '积分', empty: '这一周期暂无分佣数据', load: '加载更多', back: '返回分佣收益明细', unresolved: '部分历史分佣的邀请归属待核对', invalid: '请选择不超过 60 天、且不晚于今天的 UTC 日期范围。', failed: '分佣报表加载失败，请稍后重试。', app: (name: string) => `当前仅显示${name}的分佣数据。`, signIn: '请先登录', unknown: '昵称未设置', details: '查看下一级贡献' },
  en: { title: 'Commission earnings details', entryHint: 'See how each direct invitee’s chain contributes', yesterday: 'Yesterday', recent: (days: number) => `Last ${days} days`, custom: 'Custom', start: 'Start date', end: 'End date', direct: 'Direct commission', indirect: 'Indirect commission', total: 'Total commission', source: 'Contributing user', period: 'Period (UTC)', points: 'points', empty: 'No commission in this period', load: 'Load more', back: 'Back to commission details', unresolved: 'Some historical invitation routes need review', invalid: 'Select up to 60 UTC days ending no later than today.', failed: 'Could not load commission report. Try again later.', app: (name: string) => `Showing only ${name} commission data.`, signIn: 'Sign in first', unknown: 'No nickname', details: 'View next-level contributions' },
  es: { title: 'Detalle de comisiones', entryHint: 'Consulta los aportes de cada invitado directo', yesterday: 'Ayer', recent: (days: number) => `Últimos ${days} días`, custom: 'Personalizar', start: 'Fecha inicial', end: 'Fecha final', direct: 'Comisión directa', indirect: 'Comisión indirecta', total: 'Comisión total', source: 'Usuario que aportó', period: 'Período (UTC)', points: 'puntos', empty: 'Sin comisiones en este período', load: 'Cargar más', back: 'Volver al detalle', unresolved: 'Algunas relaciones históricas requieren revisión', invalid: 'Elige hasta 60 días UTC sin fechas futuras.', failed: 'No se pudo cargar el informe.', app: (name: string) => `Solo se muestran comisiones de ${name}.`, signIn: 'Inicia sesión', unknown: 'Sin apodo', details: 'Ver aportes del siguiente nivel' },
  id: { title: 'Rincian komisi', entryHint: 'Lihat kontribusi rantai setiap undangan langsung', yesterday: 'Kemarin', recent: (days: number) => `${days} hari terakhir`, custom: 'Kustom', start: 'Tanggal mulai', end: 'Tanggal akhir', direct: 'Komisi langsung', indirect: 'Komisi tidak langsung', total: 'Total komisi', source: 'Pengguna penyumbang', period: 'Periode (UTC)', points: 'poin', empty: 'Belum ada komisi pada periode ini', load: 'Muat lainnya', back: 'Kembali ke rincian komisi', unresolved: 'Beberapa jalur undangan lama perlu ditinjau', invalid: 'Pilih maksimal 60 hari UTC tanpa tanggal mendatang.', failed: 'Laporan komisi gagal dimuat.', app: (name: string) => `Hanya menampilkan komisi ${name}.`, signIn: 'Masuk dahulu', unknown: 'Belum ada nama panggilan', details: 'Lihat kontribusi tingkat berikutnya' },
  pt: { title: 'Detalhes das comissões', entryHint: 'Veja a contribuição da rede de cada convidado direto', yesterday: 'Ontem', recent: (days: number) => `Últimos ${days} dias`, custom: 'Personalizar', start: 'Data inicial', end: 'Data final', direct: 'Comissão direta', indirect: 'Comissão indireta', total: 'Comissão total', source: 'Usuário de origem', period: 'Período (UTC)', points: 'pontos', empty: 'Sem comissões neste período', load: 'Carregar mais', back: 'Voltar aos detalhes', unresolved: 'Algumas relações históricas precisam de revisão', invalid: 'Selecione até 60 dias UTC sem datas futuras.', failed: 'Não foi possível carregar o relatório.', app: (name: string) => `Exibindo apenas comissões do ${name}.`, signIn: 'Entre primeiro', unknown: 'Sem apelido', details: 'Ver contribuições do próximo nível' },
} as const

function utcReportDate(offsetDays = 0) {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + offsetDays)
  return date.toISOString().slice(0, 10)
}

function validCommissionPeriod(start: string, end: string) {
  const startMs = Date.parse(`${start}T00:00:00Z`)
  const endMs = Date.parse(`${end}T00:00:00Z`)
  return /^\d{4}-\d{2}-\d{2}$/.test(start) && /^\d{4}-\d{2}-\d{2}$/.test(end)
    && Number.isFinite(startMs) && Number.isFinite(endMs) && startMs <= endMs
    && end <= utcReportDate() && (endMs - startMs) / 86400000 < 60
}

function CommissionReportPage({ directInviteeUserId }: { directInviteeUserId?: number }) {
  const [session] = useState<SessionState | null>(() => loadJsonState<SessionState>(STORAGE_KEY))
  const [locale] = useState<ConsumerLocale>(() => loadExternalLocale())
  const copy = commissionReportCopy[locale]
  const metricSeparator = locale === 'zh' ? '：' : ': '
  const pageLanguage = { zh: 'zh-CN', en: 'en', es: 'es', id: 'id', pt: 'pt-BR' }[locale]
  const initialParams = new URLSearchParams(window.location.search)
  const [startDate, setStartDate] = useState(() => initialParams.get('startDate') || utcReportDate(-6))
  const [endDate, setEndDate] = useState(() => initialParams.get('endDate') || utcReportDate())
  const [quick, setQuick] = useState<number | 'yesterday' | 'custom'>(() =>
    initialParams.has('startDate') || initialParams.has('endDate') ? 'custom' : 7)
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(() => initialParams.has('startDate') || initialParams.has('endDate'))
  const [platform, setPlatform] = useState<'TIMO' | 'LINKY' | null>(null)
  const [workspaceLoaded, setWorkspaceLoaded] = useState(false)
  const [verified, setVerified] = useState(false)
  const [report, setReport] = useState<InvitationCommissionReportResponse | null>(null)
  const [sources, setSources] = useState<InvitationCommissionSourceResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const valid = validCommissionPeriod(startDate, endDate)

  useEffect(() => {
    if (!session) return
    let active = true
    void getConsumerWorkspace(session.userId, session.accessToken).then((workspace) => {
      if (!active) return
      setPlatform(workspace.selected)
      setVerified(workspace.apps.some((app) => app.code === workspace.selected && app.verified))
      setWorkspaceLoaded(true)
    }).catch(() => { if (active) { setError(copy.failed); setWorkspaceLoaded(true) } })
    return () => { active = false }
  }, [session, copy.failed])

  useEffect(() => {
    if (!session || !platform || !verified || !valid) return
    let active = true
    async function load() {
      setLoading(true)
      setError('')
      setReport(null)
      setSources(null)
      try {
        if (!session || !platform) return
        if (directInviteeUserId) {
          const result = await getInvitationCommissionSources(session.userId, session.accessToken, platform, directInviteeUserId, startDate, endDate)
          if (active) setSources(result)
        } else {
          const result = await getInvitationCommissionReport(session.userId, session.accessToken, platform, startDate, endDate)
          if (active) setReport(result)
        }
      } catch { if (active) setError(copy.failed) } finally { if (active) setLoading(false) }
    }
    void load()
    return () => { active = false }
  }, [session, platform, verified, valid, startDate, endDate, directInviteeUserId, copy.failed])

  function chooseQuick(days: number | 'yesterday') {
    setQuick(days)
    setStartDate(utcReportDate(days === 'yesterday' ? -1 : 1 - days))
    setEndDate(utcReportDate(days === 'yesterday' ? -1 : 0))
  }

  async function loadMore() {
    if (!session || !platform || loading) return
    const current = directInviteeUserId ? sources : report
    if (!current?.hasMore) return
    setLoading(true)
    try {
      if (directInviteeUserId && sources) {
        const next = await getInvitationCommissionSources(session.userId, session.accessToken, platform, directInviteeUserId, startDate, endDate, sources.page + 1)
        setSources({ ...next, items: [...sources.items, ...next.items] })
      } else if (report) {
        const next = await getInvitationCommissionReport(session.userId, session.accessToken, platform, startDate, endDate, report.page + 1)
        setReport({ ...next, items: [...report.items, ...next.items] })
      }
    } catch { setError(copy.failed) } finally { setLoading(false) }
  }

  const reportUrl = `/earnings/commission?${new URLSearchParams({ startDate, endDate })}`
  return <div className="consumer-app-page"><main className="consumer-shell consumer-detail-page" lang={pageLanguage}>
    <header className="consumer-topbar"><a className="consumer-brand" href="/earnings">BANDEIRA</a><ConsumerAccountLink locale={locale} /></header>
    <a className="consumer-detail-back" href={directInviteeUserId ? reportUrl : '/earnings'}>← {directInviteeUserId ? copy.back : consumerNavigationCopy[locale].earnings}</a>
    <section className="consumer-commercial-heading"><h1>{copy.title}</h1></section>
    {!session ? <a className="consumer-primary-link" href="/invite#phone-login">{copy.signIn}</a> : !workspaceLoaded ? <p>{workspaceCopy[locale].loading}</p> : !platform || !verified ? <ConsumerUnboundGuidance locale={locale} variant="gate" /> : <>
      <p className="consumer-workspace-banner">{copy.app(consumerAppName(platform))}</p>
      <section className="consumer-settings-card consumer-commission-filters">
        <h2>{copy.period}</h2>
        <div className="consumer-commission-quick">{(['yesterday', 3, 7] as const).map((days) =>
          <button key={days} type="button" className={quick === days ? 'is-selected' : ''} onClick={() => chooseQuick(days)}>{days === 'yesterday' ? copy.yesterday : copy.recent(days)}</button>)}</div>
        <button type="button" className="consumer-commission-more-filters" aria-expanded={advancedFiltersOpen} onClick={() => setAdvancedFiltersOpen((value) => !value)}>{({ zh: '更多日期选择', en: 'More dates', es: 'Más fechas', id: 'Pilihan tanggal lain', pt: 'Mais datas' } as const)[locale]}{!advancedFiltersOpen && quick !== 'yesterday' && quick !== 3 && quick !== 7 ? ` · ${quick === 'custom' ? copy.custom : copy.recent(quick)}` : ''} {advancedFiltersOpen ? '⌃' : '⌄'}</button>
        {advancedFiltersOpen ? <><div className="consumer-commission-quick">{([14, 30, 60] as const).map((days) =>
          <button key={days} type="button" className={quick === days ? 'is-selected' : ''} onClick={() => chooseQuick(days)}>{copy.recent(days)}</button>)}</div>
          <div className="consumer-commission-dates"><label>{copy.start}<input type="date" value={startDate} max={utcReportDate()} onChange={(event) => { setQuick('custom'); setStartDate(event.target.value) }} /></label><label>{copy.end}<input type="date" value={endDate} max={utcReportDate()} onChange={(event) => { setQuick('custom'); setEndDate(event.target.value) }} /></label></div></> : null}
        {quick === 'custom' ? <small>{copy.custom} · {copy.period}</small> : null}
        {!valid ? <p className="consumer-commission-warning" role="alert">{copy.invalid}</p> : null}
      </section>
      {error ? <div className="consumer-banner is-error" role="alert">{error}</div> : null}
      {valid && directInviteeUserId && sources?.platformCode === platform && sources.startDate === startDate && sources.endDate === endDate ? <section className="consumer-settings-card">
        <h2>{sources.directInviteeNickname || copy.unknown} · #{sources.directInviteeUserId}</h2>
        <p>{copy.indirect}{metricSeparator}{formatMoney(sources.indirectPoints, locale)} {copy.points}</p>
        {sources.items.length ? <div className="consumer-commission-list">{sources.items.map((item) => <div className="consumer-commission-row" key={item.userId}><span><strong>{item.nickname || copy.unknown}</strong><small>#{item.userId}</small></span><span><small>{copy.indirect}</small><strong>{formatMoney(item.points, locale)} {copy.points}</strong></span></div>)}</div> : !loading ? <p>{copy.empty}</p> : null}
      </section> : valid && !directInviteeUserId && report?.platformCode === platform && report.startDate === startDate && report.endDate === endDate ? <section className="consumer-settings-card">
        <div className="consumer-detail-grid consumer-commission-summary"><div><span>{copy.direct}</span><strong>{formatMoney(report.directPoints, locale)} {copy.points}</strong></div><div><span>{copy.indirect}</span><strong>{formatMoney(report.indirectPoints, locale)} {copy.points}</strong></div><div><span>{copy.total}</span><strong>{formatMoney(report.totalPoints, locale)} {copy.points}</strong></div></div>
        {report.unattributedPoints !== 0 ? <p className="consumer-commission-warning">{copy.unresolved}{metricSeparator}{formatMoney(report.unattributedPoints, locale)} {copy.points}</p> : null}
        {report.items.length ? <div className="consumer-commission-list">{report.items.map((item) => item.userId > 0 ? <a className="consumer-commission-row" key={item.userId} href={`/earnings/commission/invitees/${item.userId}?${new URLSearchParams({ startDate, endDate })}`}><span><strong>{item.nickname || copy.unknown}</strong><small>#{item.userId} · {copy.details}</small></span><span><small>{copy.direct} {formatMoney(item.directPoints, locale)}</small><small>{copy.indirect} {formatMoney(item.indirectPoints, locale)}</small><strong>{copy.total} {formatMoney(item.totalPoints, locale)} {copy.points}</strong></span><CaretRight weight="bold" /></a> : <div className="consumer-commission-row" key="unresolved"><strong>{copy.unresolved}</strong><strong>{formatMoney(item.totalPoints, locale)} {copy.points}</strong></div>)}</div> : !loading ? <p>{copy.empty}</p> : null}
      </section> : null}
      {loading ? <p>{workspaceCopy[locale].loading}</p> : null}
      {(directInviteeUserId
        ? sources?.platformCode === platform && sources.startDate === startDate && sources.endDate === endDate && sources.hasMore
        : report?.platformCode === platform && report.startDate === startDate && report.endDate === endDate && report.hasMore)
        ? <button className="consumer-detail-load-more" type="button" disabled={loading} onClick={() => void loadMore()}>{copy.load}</button> : null}
    </>}
    {session ? <ConsumerBottomNavigation locale={locale} active="earnings" /> : null}
  </main></div>
}

function ConsumerLandingPage() {
  const [session] = useState<SessionState | null>(() => loadJsonState<SessionState>(STORAGE_KEY))
  const [error, setError] = useState(false)
  const locale = loadExternalLocale()
  useEffect(() => {
    if (!session) return
    let active = true
    void getConsumerWorkspace(session.userId, session.accessToken)
      .then((workspace) => { if (active) window.location.replace(workspace.selected ? '/earnings' : '/account') })
      .catch((error) => {
        if (!active) return
        if (/access denied|unauthorized|session/i.test(String(error))) {
          window.localStorage.removeItem(STORAGE_KEY)
          window.location.replace('/invite#phone-login')
        } else setError(true)
      })
    return () => { active = false }
  }, [session])
  if (!session) return <InviteCodePage />
  return <div className="consumer-app-page"><main className="consumer-shell consumer-form-shell"><section className="consumer-settings-card">
    <h1>{error ? workspaceCopy[locale].error : workspaceCopy[locale].loading}</h1>
    {error ? <a href="/app">{workspaceCopy[locale].choose}</a> : null}
  </section></main></div>
}

function App() {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/'
  const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
  if (hostname === 'partner.bandeira.fandodo.online') return <PartnerPortal />
  if (hostname === 'app.bandeira.fandodo.online' && (pathname === '/' || pathname.startsWith('/admin'))) return <ConsumerLandingPage />
  if (pathname === '/app') return <ConsumerLandingPage />
  if (pathname.startsWith('/account/profile')) return <PublicProfilePage />
  if (pathname.startsWith('/account/timo')) return <TimoBindingPage />
  if (pathname.startsWith('/account/linky') || pathname.startsWith('/bind')) return <BindLandingPage />
  if (pathname.startsWith('/account')) return <AccountPage />
  if (pathname.startsWith('/invite')) return <InviteCodePage />
  if (pathname.startsWith('/earnings/effective-users')) return <EarningsPage view="effective" />
  if (pathname.startsWith('/earnings/activity')) return <EarningsPage view="activity" />
  if (pathname.startsWith('/earnings/commission/invitees/')) {
    const directInviteeUserId = Number(pathname.split('/').pop())
    return <CommissionReportPage directInviteeUserId={Number.isSafeInteger(directInviteeUserId) ? directInviteeUserId : -1} />
  }
  if (pathname.startsWith('/earnings/commission')) return <CommissionReportPage />
  if (pathname.startsWith('/earnings')) return <EarningsPage />
  if (hostname === 'app.bandeira.fandodo.online') return <InviteCodePage />
  const designPreview = import.meta.env.DEV && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('adminPreview') === '1'
  return <ConsoleApp initialAdminSession={designPreview ? {
    sessionToken: 'local-design-preview',
    expiresAt: '2099-12-31T23:59:59Z',
    username: 'design-preview',
    displayName: 'BANDEIRA Admin',
    role: 'super_admin',
    platformScope: '*',
    guildScope: '*',
    regionScope: 'BR',
  } : null} />
}

export { ConsoleApp }
export default App
