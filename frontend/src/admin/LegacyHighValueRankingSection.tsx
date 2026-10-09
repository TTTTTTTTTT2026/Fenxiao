import { useEffect, useState, type FormEvent } from 'react'
import { PanelSection } from './LegacyPresentation'
import { getHighValueRanking, type HighValueRankingFilters, type HighValueRankingReport, type RankingMetric } from './highValueRankingApi'
import { isoWeek, utcPeriodRange, type RankingPeriod } from './highValueRankingModel'
import { getAdminUserDirectoryOptions, type UserDirectoryOptions } from './userDirectoryApi'
import './LegacyHighValueRankingSection.css'

type Platform = 'LINKY' | 'TIMO'
type Filters = { platform: Platform | ''; guild: string; periodValue: string; operator: string; country: string; metric: RankingMetric }
const periodLabels: Record<RankingPeriod, string> = { day: '日榜', week: '周榜', month: '月榜' }
const countryLabels: Record<string, string> = { BR: '巴西', ID: '印尼', MX: '墨西哥', CN: '中国', HK: '中国香港' }
const metricLabels: Record<RankingMetric, string> = { NEW_INVITEES: '新增裂变人数', DIRECT_RAW_DIAMONDS: '直接下级收入（裸钻）', SELF_COMMISSION: '自身收入（分佣积分）' }
const formatNumber = (value: number) => value.toLocaleString('zh-CN', { maximumFractionDigits: 6 })

function defaultPeriod(period: RankingPeriod): string {
  const date = new Date()
  if (period === 'day') date.setUTCDate(date.getUTCDate() - 1)
  if (period === 'week') date.setUTCDate(date.getUTCDate() - 7)
  if (period === 'month') { date.setUTCDate(1); date.setUTCMonth(date.getUTCMonth() - 1) }
  return period === 'day' ? date.toISOString().slice(0, 10) : period === 'week' ? isoWeek(date) : date.toISOString().slice(0, 7)
}

function periodFromLegacyHash(): RankingPeriod {
  if (typeof window === 'undefined') return 'day'
  if (window.location.hash === '#admin-high-value-week') return 'week'
  if (window.location.hash === '#admin-high-value-month') return 'month'
  return 'day'
}

export default function LegacyHighValueRankingSection({ sessionToken, initialPeriod, initialPlatform = '', initialMetric = 'SELF_COMMISSION' }: {
  sessionToken: string
  initialPeriod?: RankingPeriod
  initialPlatform?: Platform | ''
  initialMetric?: RankingMetric
}) {
  const [period, setPeriod] = useState<RankingPeriod>(() => initialPeriod ?? periodFromLegacyHash())
  const [draft, setDraft] = useState<Filters>(() => ({ platform: initialPlatform, guild: 'all', periodValue: defaultPeriod(initialPeriod ?? periodFromLegacyHash()), operator: 'all', country: 'BR', metric: initialMetric }))
  const [query, setQuery] = useState<HighValueRankingFilters | null>(null)
  const [report, setReport] = useState<HighValueRankingReport | null>(null)
  const [options, setOptions] = useState<UserDirectoryOptions | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const guilds = draft.platform === 'LINKY' ? options?.linkyGuilds : draft.platform === 'TIMO' ? options?.timoGuilds : []
  const range = utcPeriodRange(period, draft.periodValue)

  useEffect(() => {
    let active = true
    void getAdminUserDirectoryOptions(sessionToken).then((value) => { if (active) setOptions(value) })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : '加载筛选选项失败') })
    return () => { active = false }
  }, [sessionToken])

  useEffect(() => {
    if (!query) return
    let active = true
    void getHighValueRanking(sessionToken, query).then((value) => { if (active) setReport(value) })
      .catch((err) => { if (active) { setReport(null); setError(err instanceof Error ? err.message : '查询排行失败') } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [query, sessionToken])

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!draft.platform || !draft.country || !range) { setError('请选择应用、国家及有效的统计周期'); return }
    if (new Date(range.end).getTime() >= Date.now()) { setError('仅可查询已经结束的 UTC 统计周期'); return }
    setLoading(true)
    setError('')
    setReport(null)
    setQuery({ platformCode: draft.platform, guildId: draft.guild === 'all' ? undefined : draft.guild,
      countryCode: draft.country, period, periodValue: draft.periodValue,
      operatorAdminId: draft.operator === 'all' ? undefined : Number(draft.operator),
      rankingMetric: draft.metric, page: 0, size: 20 })
  }

  function switchPeriod(next: RankingPeriod) {
    if (next === period) return
    setPeriod(next)
    setDraft({ ...draft, periodValue: defaultPeriod(next) })
    setReport(null)
    setQuery(null)
    setLoading(false)
    setError('')
  }

  function switchPage(nextPage: number) {
    if (!query) return
    setLoading(true)
    setError('')
    setQuery({ ...query, page: nextPage })
  }

  const appliedMetric = query?.rankingMetric ?? draft.metric
  return <PanelSection sectionId="admin-high-value-ranking" eyebrow="High value ranking" title="高价值用户排行" description="按统计周期末的用户价值标签确定入榜资格；选择单个应用、国家及排行依据查询真实数据。">
    <nav className="high-value-period-tabs" aria-label="高价值用户排行周期">
      {(['day', 'week', 'month'] as RankingPeriod[]).map((value) => <button key={value} type="button" className={period === value ? 'is-active' : ''} aria-pressed={period === value} onClick={() => switchPeriod(value)}>{periodLabels[value]}</button>)}
    </nav>
    <form className="high-value-filter-grid" onSubmit={applyFilters}>
      <label>应用（必选）<select required value={draft.platform} onChange={(event) => setDraft({ ...draft, platform: event.target.value as Platform | '', guild: 'all' })}><option value="">请选择一个应用</option><option value="LINKY">Linky</option><option value="TIMO">Timo</option></select></label>
      <label>公会<select disabled={!draft.platform} value={draft.guild} onChange={(event) => setDraft({ ...draft, guild: event.target.value })}><option value="all">当前应用全部公会</option>{(guilds ?? []).map((guild) => <option key={guild.guildId} value={guild.guildId}>{guild.guildName || guild.guildId}</option>)}</select></label>
      <label>统计{period === 'day' ? '日期' : period === 'week' ? '自然周' : '月份'}<input aria-label="统计周期" required type={period === 'day' ? 'date' : period === 'week' ? 'week' : 'month'} value={draft.periodValue} onChange={(event) => setDraft({ ...draft, periodValue: event.target.value })} /></label>
      <label>对接运营<select value={draft.operator} onChange={(event) => setDraft({ ...draft, operator: event.target.value })}><option value="all">全部对接运营</option>{(options?.operators ?? []).map((operator) => <option key={operator.id} value={operator.id}>{operator.displayName}</option>)}</select></label>
      <label>国家／地区（必选）<select required value={draft.country} onChange={(event) => setDraft({ ...draft, country: event.target.value })}>{Object.entries(countryLabels).map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></label>
      <label>排行依据<select value={draft.metric} onChange={(event) => setDraft({ ...draft, metric: event.target.value as RankingMetric })}>{(Object.entries(metricLabels) as Array<[RankingMetric, string]>).map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></label>
      <button className="primary-btn" type="submit" disabled={loading}>查询</button>
    </form>
    <div className="high-value-report-meta">
      <span>当前筛选：{report ? `${report.platformCode} · ${report.guildId || '全部公会'} · ${countryLabels[report.countryCode] ?? report.countryCode}` : '尚未查询'}</span>
      <span>统计边界：{report ? `${report.periodStart} 至 ${report.periodEndExclusive}（不含）UTC` : '请选择完整周期'}</span>
      <span>入榜标签：周期结束时为「高价值用户」</span>
      <span>排行依据：{metricLabels[appliedMetric]} · 从高到低</span>
    </div>
    {error ? <div className="high-value-error" role="alert">{error}</div> : null}
    {loading ? <div className="high-value-empty-state" role="status">正在查询真实统计数据…</div> : !report ? <div className="high-value-empty-state">请选择 Linky 或 Timo 应用并点击「查询」，查看当前应用的排行。</div> : <>
      {report.coveredIncomeDays < report.expectedIncomeDays ? <div className="high-value-warning" role="status">所选周期的 MCN 已确认收入投影仅覆盖 {report.coveredIncomeDays}/{report.expectedIncomeDays} 天；收入指标可能不完整，请先核对同步状态。</div> : null}
      <div className="high-value-table-scroll"><table className="high-value-ranking-table">
        <thead><tr><th scope="col">排名</th><th scope="col">用户昵称 / ID</th><th scope="col">自身收入<br /><small>分佣积分</small></th><th scope="col">直接下级收入<br /><small>MCN 已确认裸钻</small></th><th scope="col">新增裂变人数<br /><small>直属成功绑定</small></th></tr></thead>
        <tbody>{report.items.map((row, index) => <tr key={row.userId}><td><span className={`high-value-rank high-value-rank-${report.page * report.size + index + 1}`}>{report.page * report.size + index + 1}</span></td><td><strong>{row.nickname || '未设置昵称'}</strong><small>#{row.userId}</small></td><td className={appliedMetric === 'SELF_COMMISSION' ? 'high-value-primary-number' : undefined}>{formatNumber(row.selfCommission)}</td><td className={appliedMetric === 'DIRECT_RAW_DIAMONDS' ? 'high-value-primary-number' : undefined}>{formatNumber(row.directRawDiamonds)}</td><td className={appliedMetric === 'NEW_INVITEES' ? 'high-value-primary-number' : undefined}>{row.newInvitees}</td></tr>)}</tbody>
      </table></div>
      {report.items.length === 0 ? <div className="high-value-empty-state">该筛选条件下没有符合周期末高价值标签的用户。</div> : null}
      <div className="high-value-pagination"><span>共 {report.total} 位用户</span><button type="button" disabled={loading || report.page === 0} onClick={() => switchPage(report.page - 1)}>上一页</button><span>第 {report.page + 1} 页</span><button type="button" disabled={loading || (report.page + 1) * report.size >= report.total} onClick={() => switchPage(report.page + 1)}>下一页</button></div>
    </>}
    <p className="high-value-footnote">自身收入为当前应用、公会内直接及间接下级产生的分佣积分净额；直接下级收入为其 MCN 已确认、分成前的裸钻。新增裂变人数按本周期首次成功绑定当前应用计数。对接运营筛选按业务事件发生时的负责人归属，不因转交回写历史；国家按用户当前归属筛选。</p>
  </PanelSection>
}
