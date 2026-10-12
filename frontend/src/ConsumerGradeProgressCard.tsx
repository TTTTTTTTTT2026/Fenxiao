import { useEffect, useState } from 'react'
import { getConsumerGradeProgress, type ConsumerGradeProgressResponse } from './api'
import { formatConsumerUserGrade, type ConsumerLocale } from './shared/catalog'

const statusTitle: Record<ConsumerLocale, string> = { zh: '等级状态', en: 'Grade status', es: 'Estado del nivel', id: 'Status tingkat', pt: 'Status do nível' }

const copy: Record<ConsumerLocale, {
  title: string; qualified: string; hint: string; pending: string; achieved: string; review: string; unknown: string
  failed: string; loading: string; retry: string; progress: string; remaining: (count: number) => string
}> = {
  zh: { title: '升级为新星', qualified: '已达标', hint: '仅计算你直接邀请、已达到有效用户条件的朋友。', pending: '人数条件已满足，等级复核尚未完成。', achieved: '已确认等级', review: '等级状态需要进一步核实。', unknown: '升级进度暂时无法确认。', failed: '暂时无法读取升级进度。', loading: '正在读取升级进度…', retry: '重试', progress: '查看直属邀请进展', remaining: (n) => `还差 ${n} 位有效直邀` },
  en: { title: 'Become a Rising Star', qualified: 'Qualified direct invitees', hint: 'Only friends you invited directly who have met the eligibility requirements count.', pending: 'The invite count requirement is met. Grade review has not finished.', achieved: 'Confirmed grade', review: 'Your grade status needs further review.', unknown: 'Grade progress cannot be confirmed yet.', failed: 'Could not load grade progress.', loading: 'Loading grade progress…', retry: 'Retry', progress: 'View direct invite progress', remaining: (n) => `${n} more qualified direct ${n === 1 ? 'invitee' : 'invitees'} needed` },
  es: { title: 'Alcanza Nueva estrella', qualified: 'Invitados directos válidos', hint: 'Solo cuentan los amigos invitados directamente que cumplen los requisitos.', pending: 'Ya cumples el número de invitados. La revisión del nivel aún no ha terminado.', achieved: 'Nivel confirmado', review: 'Tu nivel necesita una revisión adicional.', unknown: 'Aún no se puede confirmar el progreso.', failed: 'No se pudo cargar el progreso.', loading: 'Cargando progreso…', retry: 'Reintentar', progress: 'Ver progreso de invitaciones directas', remaining: (n) => n === 1 ? 'Falta 1 invitado directo válido' : `Faltan ${n} invitados directos válidos` },
  id: { title: 'Menjadi Bintang baru', qualified: 'Undangan langsung yang memenuhi syarat', hint: 'Hanya teman yang Anda undang langsung dan telah memenuhi syarat pengguna valid yang dihitung.', pending: 'Syarat jumlah undangan terpenuhi. Peninjauan tingkat belum selesai.', achieved: 'Tingkat yang dikonfirmasi', review: 'Status tingkat Anda perlu ditinjau lebih lanjut.', unknown: 'Progres tingkat belum dapat dipastikan.', failed: 'Progres tingkat belum dapat dimuat.', loading: 'Memuat progres tingkat…', retry: 'Coba lagi', progress: 'Lihat progres undangan langsung', remaining: (n) => `Masih perlu ${n} undangan langsung yang memenuhi syarat` },
  pt: { title: 'Torne-se Nova estrela', qualified: 'Convidados diretos qualificados', hint: 'Contam apenas os amigos convidados diretamente que já cumprem os requisitos.', pending: 'A quantidade exigida foi atingida. A revisão do nível ainda não terminou.', achieved: 'Nível confirmado', review: 'Seu nível precisa de uma análise adicional.', unknown: 'Ainda não é possível confirmar o progresso.', failed: 'Não foi possível carregar o progresso.', loading: 'Carregando progresso…', retry: 'Tentar novamente', progress: 'Ver progresso dos convites diretos', remaining: (n) => n === 1 ? 'Falta 1 convidado direto qualificado' : `Faltam ${n} convidados diretos qualificados` },
}

export function ConsumerGradeProgressView({ data, locale, loading = false, error = false, onRetry }: {
  data: ConsumerGradeProgressResponse | null; locale: ConsumerLocale; loading?: boolean; error?: boolean; onRetry: () => void
}) {
  const words = copy[locale]
  const count = data?.qualifiedDirectInviteCount
  const target = data?.requiredDirectInviteCount
  const numbered = !loading && !error && (data?.state === 'IN_PROGRESS' || data?.state === 'AWAITING_REVIEW')
    && typeof count === 'number' && Number.isInteger(count) && count >= 0
    && typeof target === 'number' && Number.isInteger(target) && target > 0
  const achieved = !loading && !error && data?.state === 'ACHIEVED' && Boolean(data.currentGradeCode)
  const title = achieved ? words.achieved : numbered ? words.title : statusTitle[locale]
  const message = loading ? words.loading : error ? words.failed : achieved ? null
    : data?.state === 'REVIEW_REQUIRED' ? words.review : numbered
      ? count >= target ? words.pending : words.remaining(target - count) : words.unknown
  return <section className="consumer-grade-progress" aria-label={title}>
    <h2>{title}</h2>
    {achieved ? <strong>{formatConsumerUserGrade(data!.currentGradeCode, locale)}</strong> : null}
    {numbered ? <>
      <p>{words.qualified}: <strong>{count} / {target}</strong></p>
      <progress value={Math.min(count, target)} max={target} aria-label={words.qualified} />
      <p>{words.hint}</p>
    </> : null}
    {message ? <p role={error ? 'alert' : 'status'}>{message}</p> : null}
    {error || (!loading && data?.state === 'UNKNOWN') ? <button type="button" onClick={onRetry}>{words.retry}</button> : null}
    <a href="/earnings/effective-users#direct-invite-progress">{words.progress} →</a>
  </section>
}

export default function ConsumerGradeProgressCard({ userId, accessToken, platformCode, locale }: {
  userId: number; accessToken: string; platformCode: 'TIMO' | 'LINKY'; locale: ConsumerLocale
}) {
  const [result, setResult] = useState<ConsumerGradeProgressResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [reload, setReload] = useState(0)
  useEffect(() => {
    let active = true
    void getConsumerGradeProgress(userId, accessToken, platformCode)
      .then((data) => { if (active) { if (data.platformCode !== platformCode) setError(true); else setResult(data) } })
      .catch(() => { if (active) setError(true) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [userId, accessToken, platformCode, reload])
  return <ConsumerGradeProgressView locale={locale} data={result?.platformCode === platformCode ? result : null}
    loading={loading} error={error} onRetry={() => { setResult(null); setLoading(true); setError(false); setReload((n) => n + 1) }} />
}
