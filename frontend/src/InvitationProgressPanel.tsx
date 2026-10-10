import { useEffect, useState } from 'react'
import { getInvitationProgress, type InvitationProgressResponse } from './api'
import type { ConsumerLocale } from './shared/catalog'

type Platform = 'TIMO' | 'LINKY'

const copy: Record<ConsumerLocale, {
  title: string; hint: string; registered: string; phone: string; bind: string; more: string; empty: string; failed: string; retry: string; unknown: string
  statuses: Record<string, string>
}> = {
  zh: { title: '直属邀请进展', hint: '已注册的直属用户及所选应用的绑定进展。可据此提醒尚未绑定的用户。', registered: '注册时间（UTC）', phone: '注册手机号', bind: '绑定状态', more: '加载更多', empty: '暂无直属邀请记录', failed: '邀请进展暂时无法读取，请稍后重试。', retry: '重试', unknown: '暂无法确认', statuses: { UNBOUND: '未绑定', SUBMITTED: '已提交', VERIFYING: '核验中', VERIFIED: '已绑定', REJECTED: '核验未通过', UNBIND_PENDING: '解绑中', UNKNOWN: '状态待确认' } },
  en: { title: 'Direct invite progress', hint: 'Registered direct invitees and their binding status for the selected app.', registered: 'Registered (UTC)', phone: 'Registered phone', bind: 'Binding', more: 'Load more', empty: 'No direct invitees yet', failed: 'Could not load invite progress. Try again.', retry: 'Retry', unknown: 'Unavailable', statuses: { UNBOUND: 'Not bound', SUBMITTED: 'Submitted', VERIFYING: 'Verifying', VERIFIED: 'Bound', REJECTED: 'Not verified', UNBIND_PENDING: 'Unbinding', UNKNOWN: 'Status unknown' } },
  es: { title: 'Progreso de invitaciones directas', hint: 'Usuarios registrados y estado de vinculación en la aplicación seleccionada.', registered: 'Registro (UTC)', phone: 'Teléfono registrado', bind: 'Vinculación', more: 'Ver más', empty: 'Aún no hay invitados directos', failed: 'No se pudo cargar el progreso. Inténtalo de nuevo.', retry: 'Reintentar', unknown: 'No disponible', statuses: { UNBOUND: 'Sin vincular', SUBMITTED: 'Enviado', VERIFYING: 'Verificando', VERIFIED: 'Vinculado', REJECTED: 'No verificado', UNBIND_PENDING: 'Desvinculando', UNKNOWN: 'Estado desconocido' } },
  id: { title: 'Progres undangan langsung', hint: 'Pengguna yang mendaftar dan status penghubungan di aplikasi yang dipilih.', registered: 'Terdaftar (UTC)', phone: 'Nomor terdaftar', bind: 'Status akun', more: 'Muat lagi', empty: 'Belum ada undangan langsung', failed: 'Progres undangan belum dapat dimuat. Coba lagi.', retry: 'Coba lagi', unknown: 'Tidak tersedia', statuses: { UNBOUND: 'Belum terhubung', SUBMITTED: 'Terkirim', VERIFYING: 'Memverifikasi', VERIFIED: 'Terhubung', REJECTED: 'Tidak terverifikasi', UNBIND_PENDING: 'Sedang diputus', UNKNOWN: 'Status belum diketahui' } },
  pt: { title: 'Progresso dos convites diretos', hint: 'Usuários cadastrados e vínculo no aplicativo selecionado.', registered: 'Cadastro (UTC)', phone: 'Telefone cadastrado', bind: 'Vínculo', more: 'Carregar mais', empty: 'Nenhum convidado direto', failed: 'Não foi possível carregar o progresso. Tente novamente.', retry: 'Tentar novamente', unknown: 'Indisponível', statuses: { UNBOUND: 'Não vinculado', SUBMITTED: 'Enviado', VERIFYING: 'Verificando', VERIFIED: 'Vinculado', REJECTED: 'Não verificado', UNBIND_PENDING: 'Desvinculando', UNKNOWN: 'Estado desconhecido' } },
}

export default function InvitationProgressPanel({ userId, accessToken, locale, initialPlatform = 'TIMO', allowSwitch = true }: {
  userId: number; accessToken: string; locale: ConsumerLocale; initialPlatform?: Platform; allowSwitch?: boolean
}) {
  const [platform, setPlatform] = useState<Platform>(initialPlatform)
  const [result, setResult] = useState<InvitationProgressResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [reload, setReload] = useState(0)
  const words = copy[locale]

  useEffect(() => {
    let active = true
    void getInvitationProgress(userId, accessToken, platform)
      .then((data) => { if (active) setResult(data) })
      .catch(() => { if (active) setError(true) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [userId, accessToken, platform, reload])

  function choosePlatform(next: Platform) {
    if (next === platform) return
    setResult(null)
    setError(false)
    setLoading(true)
    setPlatform(next)
  }

  function retry() {
    setError(false)
    setLoading(true)
    setReload((value) => value + 1)
  }

  async function loadMore() {
    if (!result?.hasMore || loading) return
    setLoading(true)
    setError(false)
    try {
      const next = await getInvitationProgress(userId, accessToken, platform, result.page + 1)
      setResult({ ...next, items: [...result.items, ...next.items] })
    } catch { setError(true) } finally { setLoading(false) }
  }

  return <section className="consumer-settings-card consumer-invitation-progress" aria-label={words.title}>
    <h2>{words.title}</h2><p>{words.hint}</p>
    {allowSwitch ? <div className="consumer-invitation-apps" role="group" aria-label="App">
      {(['TIMO', 'LINKY'] as const).map((app) => <button key={app} type="button" className={platform === app ? 'is-selected' : ''} onClick={() => choosePlatform(app)}>{app === 'TIMO' ? 'Timo' : 'Linky'}</button>)}
    </div> : <strong>{platform === 'TIMO' ? 'Timo' : 'Linky'}</strong>}
    {result?.platformCode === platform && result.items.length ? <div className="consumer-invitation-list">
      {result.items.map((item) => <div className="consumer-invitation-row" key={item.userId}>
        <strong>#{item.userId}</strong>
        <span>{words.phone}: {item.maskedPhone || '—'}</span>
        <span>{words.registered}: {item.registeredAt?.slice(0, 10) || '—'}</span>
        <span>{words.bind}: <b>{words.statuses[item.bindingStatus] || words.unknown}</b></span>
      </div>)}
    </div> : !loading && !error ? <p>{words.empty}</p> : null}
    {error ? <p role="alert">{words.failed} <button type="button" onClick={retry}>{words.retry}</button></p> : null}
    {loading ? <p role="status">…</p> : null}
    {result?.platformCode === platform && result.hasMore ? <button type="button" disabled={loading} onClick={() => void loadMore()}>{words.more}</button> : null}
  </section>
}
