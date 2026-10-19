import { useEffect, useState, type KeyboardEvent } from 'react'
import { Info } from '@phosphor-icons/react'
import { demoPeriods, getDemoLeaderboard, type DemoPeriod, type DemoSnapshot } from './consumerDemoLeaderboardApi'
import type { ConsumerLocale } from './shared/catalog'
import './ConsumerDemoLeaderboard.css'

const words = {
  zh: { title:'奖励排行榜', demo:'示例榜单 · 非真实收益', tabs:['日榜','周榜','月榜'], rank:'排名', user:'用户', invites:'邀请人数', amount:'奖励 (USD)', scope:'印尼、巴西混合示例 · UTC', range:'统计周期', asOf:'数据覆盖至', stale:'更新暂有延迟，当前为上一版示例', note:'头像、昵称、人数与金额均为虚构示例，非真实用户收益；USD 不代表可提现金额。', loading:'示例榜单加载中…', failed:'示例榜单暂时无法加载', retry:'重试', ID:'印度尼西亚', BR:'巴西' },
  en: { title:'Reward leaderboard', demo:'Demo leaderboard · Not real earnings', tabs:['Daily','Weekly','Monthly'], rank:'Rank', user:'User', invites:'Invites', amount:'Rewards (USD)', scope:'Mixed Indonesia / Brazil demo · UTC', range:'Period', asOf:'Data through', stale:'Update delayed; showing the previous demo snapshot', note:'Avatars, names, invite counts and amounts are fictional examples, not actual user earnings. USD amounts are not withdrawable.', loading:'Loading demo leaderboard…', failed:'Demo leaderboard is unavailable', retry:'Retry', ID:'Indonesia', BR:'Brazil' },
  es: { title:'Clasificación de recompensas', demo:'Clasificación de ejemplo · No son ingresos reales', tabs:['Diaria','Semanal','Mensual'], rank:'Puesto', user:'Usuario', invites:'Invitados', amount:'Premios (USD)', scope:'Ejemplo mixto Indonesia / Brasil · UTC', range:'Período', asOf:'Datos hasta', stale:'Actualización retrasada; se muestra el ejemplo anterior', note:'Avatares, nombres, invitados e importes son ejemplos ficticios, no ingresos reales. Los importes en USD no se pueden retirar.', loading:'Cargando clasificación de ejemplo…', failed:'Clasificación de ejemplo no disponible', retry:'Reintentar', ID:'Indonesia', BR:'Brasil' },
  id: { title:'Peringkat imbalan', demo:'Peringkat contoh · Bukan penghasilan nyata', tabs:['Harian','Mingguan','Bulanan'], rank:'Peringkat', user:'Pengguna', invites:'Undangan', amount:'Imbalan (USD)', scope:'Contoh gabungan Indonesia / Brasil · UTC', range:'Periode', asOf:'Data hingga', stale:'Pembaruan tertunda; menampilkan contoh sebelumnya', note:'Avatar, nama, jumlah undangan, dan nominal adalah contoh fiktif, bukan penghasilan pengguna nyata. Nominal USD tidak dapat ditarik.', loading:'Memuat peringkat contoh…', failed:'Peringkat contoh belum tersedia', retry:'Coba lagi', ID:'Indonesia', BR:'Brasil' },
  pt: { title:'Ranking de recompensas', demo:'Ranking de exemplo · Não são ganhos reais', tabs:['Diário','Semanal','Mensal'], rank:'Posição', user:'Usuário', invites:'Convites', amount:'Prêmios (USD)', scope:'Exemplo misto Indonésia / Brasil · UTC', range:'Período', asOf:'Dados até', stale:'Atualização atrasada; mostrando o exemplo anterior', note:'Avatares, nomes, convites e valores são exemplos fictícios, não ganhos reais. Os valores em USD não estão disponíveis para saque.', loading:'Carregando ranking de exemplo…', failed:'Ranking de exemplo indisponível', retry:'Tentar novamente', ID:'Indonésia', BR:'Brasil' },
} as const

export function ConsumerDemoLeaderboardView({locale, data, period, loading, failed, onPeriod, onRetry}: {
  locale: ConsumerLocale; data: DemoSnapshot | null; period: DemoPeriod; loading: boolean; failed: boolean
  onPeriod: (period: DemoPeriod) => void; onRetry: () => void
}) {
  const copy = words[locale]
  const board = data?.boards.find(board => board.period === period)
  const format = new Intl.NumberFormat(locale, {style:'currency', currency:'USD', minimumFractionDigits:2, maximumFractionDigits:2})
  function moveTab(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = event.key === 'ArrowRight' ? (index + 1) % 3 : event.key === 'ArrowLeft' ? (index + 2) % 3
      : event.key === 'Home' ? 0 : event.key === 'End' ? 2 : null
    if (next === null) return
    event.preventDefault(); onPeriod(demoPeriods[next])
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus()
  }
  return <section className="consumer-demo-board" aria-labelledby="demo-board-title">
    <div className="demo-board-heading"><h2 id="demo-board-title">{copy.title}</h2><span className="demo-board-top">TOP 10</span></div>
    <p className="demo-board-label">{copy.demo}</p>
    <div className="demo-board-tabs" role="tablist" aria-label={copy.range}>
      {demoPeriods.map((value,index) => <button type="button" role="tab" id={`demo-tab-${value}`} aria-controls="demo-board-panel" aria-selected={period === value}
        tabIndex={period === value ? 0 : -1} key={value} onClick={() => onPeriod(value)} onKeyDown={event => moveTab(event,index)}>{copy.tabs[index]}</button>)}
    </div>
    <p className="demo-board-scope">{copy.scope}</p>
    <div id="demo-board-panel" role="tabpanel" tabIndex={0} aria-labelledby={`demo-tab-${period}`} aria-busy={loading}>
      {loading ? <p className="demo-board-state" role="status">{copy.loading}</p> : failed || !board ? <p className="demo-board-state" role="alert">{copy.failed} <button type="button" onClick={onRetry}>{copy.retry}</button></p> : <>
        <p className="demo-board-period">{copy.range}: {board.startDate === board.endDate ? board.endDate : `${board.startDate} – ${board.endDate}`}</p>
        {data?.stale ? <p className="demo-board-stale" role="status">{copy.stale}</p> : null}
        <table><colgroup><col className="demo-col-rank" /><col /><col className="demo-col-invites" /><col className="demo-col-amount" /></colgroup>
          <thead><tr><th scope="col">{copy.rank}</th><th scope="col">{copy.user}</th><th scope="col">{copy.invites}</th><th scope="col">{copy.amount}</th></tr></thead>
          <tbody>{board.items.map(entry => <tr key={entry.personaId}>
            <td><span className={`demo-rank demo-rank-${entry.rank}`}>{entry.rank}</span></td>
            <th scope="row"><div className="demo-user"><img className="demo-avatar" src={`/demo-leaderboard/avatars/${entry.avatarAssetId}-128.webp`} srcSet={`/demo-leaderboard/avatars/${entry.avatarAssetId}-256.webp 2x`} alt="" width="40" height="40" loading="lazy" /><span><span className="demo-nickname">{entry.maskedNickname}</span><img className="demo-flag" src={`/demo-leaderboard/flags/${entry.countryCode.toLowerCase()}.svg`} alt={copy[entry.countryCode]} width="20" height="15" loading="lazy" /></span></div></th>
            <td className="demo-invites">{entry.invitationCount}</td><td className="demo-amount">{format.format(Number(entry.amountUsd))}</td>
          </tr>)}</tbody></table>
      </>}
    </div>
    <p className="demo-board-note"><Info size={19} weight="regular" aria-hidden="true" /><span>{copy.note}</span></p>
  </section>
}

export default function ConsumerDemoLeaderboard({locale}: {locale: ConsumerLocale}) {
  const [data,setData] = useState<DemoSnapshot | null>(null)
  const [period,setPeriod] = useState<DemoPeriod>('DAY')
  const [loading,setLoading] = useState(true)
  const [failed,setFailed] = useState(false)
  const [reload,setReload] = useState(0)
  useEffect(() => {
    let active = true
    void getDemoLeaderboard().then(value => { if (active) setData(value) })
      .catch(() => { if (active) setFailed(true) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  },[reload])
  return <ConsumerDemoLeaderboardView locale={locale} data={data} period={period} loading={loading} failed={failed} onPeriod={setPeriod}
    onRetry={() => {setLoading(true);setFailed(false);setReload(value => value + 1)}} />
}
