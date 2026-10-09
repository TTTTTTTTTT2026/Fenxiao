import { useState, type FormEvent } from 'react'
import { PanelSection } from './LegacyPresentation'
import { isoWeek, utcPeriodRange, type RankingPeriod } from './highValueRankingModel'
import './LegacyHighValueRankingSection.css'

type Platform = 'LINKY' | 'TIMO'
type Country = 'BR' | 'ID' | 'MX' | 'CN' | 'HK'
type RankingMetric = 'selfCommission' | 'directRawDiamonds' | 'newInvitees'
type Filters = { platform: Platform | ''; guild: string; period: string; operator: string; country: Country; metric: RankingMetric }

const periodLabels: Record<RankingPeriod, string> = { day: '日榜', week: '周榜', month: '月榜' }
const countryLabels: Record<Country, string> = { BR: '巴西', ID: '印尼', MX: '墨西哥', CN: '中国', HK: '中国香港' }
const guilds: Record<Platform, { value: string; label: string }[]> = {
  LINKY: [{ value: 'all', label: '全部 Linky 公会' }, { value: 'linky-a', label: '示例 Linky 公会 A' }, { value: 'linky-b', label: '示例 Linky 公会 B' }],
  TIMO: [{ value: 'all', label: '全部 Timo 公会' }, { value: 'timo-a', label: '示例 Timo 公会 A' }, { value: 'timo-b', label: '示例 Timo 公会 B' }],
}

function defaultPeriod(period: RankingPeriod): string {
  const date = new Date()
  if (period === 'day') date.setUTCDate(date.getUTCDate() - 1)
  if (period === 'week') date.setUTCDate(date.getUTCDate() - 7)
  if (period === 'month') {
    date.setUTCDate(1)
    date.setUTCMonth(date.getUTCMonth() - 1)
  }
  return period === 'day' ? date.toISOString().slice(0, 10) : period === 'week' ? isoWeek(date) : date.toISOString().slice(0, 7)
}

type DemoRow = { id: string; nickname: string; selfCommission: number; directRawDiamonds: number; newInvitees: number }
const baseRows: DemoRow[] = [
  { id: 'DEMO-1003', nickname: '示例用户 C', selfCommission: 12840, directRawDiamonds: 32900, newInvitees: 8 },
  { id: 'DEMO-1001', nickname: '示例用户 A', selfCommission: 10560, directRawDiamonds: 46800, newInvitees: 11 },
  { id: 'DEMO-1005', nickname: '示例用户 E', selfCommission: 8960, directRawDiamonds: 21200, newInvitees: 5 },
  { id: 'DEMO-1002', nickname: '示例用户 B', selfCommission: 6820, directRawDiamonds: 28600, newInvitees: 14 },
  { id: 'DEMO-1004', nickname: '示例用户 D', selfCommission: 4510, directRawDiamonds: 15700, newInvitees: 3 },
]

function demoRows(filters: Filters, period: RankingPeriod): DemoRow[] {
  if (!filters.platform) return []
  const multiplier = period === 'day' ? 1 : period === 'week' ? 5 : 18
  const appFactor = filters.platform === 'LINKY' ? 1 : 0.82
  const countryFactor: Record<Country, number> = { BR: 1, ID: 0.92, MX: 0.78, CN: 0.68, HK: 0.56 }
  const factor = multiplier * appFactor * countryFactor[filters.country] * (filters.guild === 'all' ? 1 : 0.67) * (filters.operator === 'all' ? 1 : 0.72)
  return baseRows.map((row) => ({
    ...row,
    selfCommission: Math.round(row.selfCommission * factor),
    directRawDiamonds: Math.round(row.directRawDiamonds * factor),
    newInvitees: Math.round(row.newInvitees * Math.max(1, factor / 2)),
  })).sort((left, right) => right[filters.metric] - left[filters.metric] || left.id.localeCompare(right.id))
}

const formatNumber = (value: number) => value.toLocaleString('zh-CN')

function periodFromLegacyHash(): RankingPeriod {
  if (typeof window === 'undefined') return 'day'
  if (window.location.hash === '#admin-high-value-week') return 'week'
  if (window.location.hash === '#admin-high-value-month') return 'month'
  return 'day'
}

export default function LegacyHighValueRankingSection({ initialPeriod, initialPlatform = '', initialMetric = 'selfCommission' }: { initialPeriod?: RankingPeriod; initialPlatform?: Platform | ''; initialMetric?: RankingMetric }) {
  const [period, setPeriod] = useState<RankingPeriod>(() => initialPeriod ?? periodFromLegacyHash())
  const [draft, setDraft] = useState<Filters>(() => ({ platform: initialPlatform, guild: 'all', period: defaultPeriod(initialPeriod ?? periodFromLegacyHash()), operator: 'all', country: 'BR', metric: initialMetric }))
  const [applied, setApplied] = useState(draft)
  const range = utcPeriodRange(period, applied.period)
  const rows = demoRows(applied, period)

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (draft.platform && utcPeriodRange(period, draft.period)) setApplied(draft)
  }

  function switchPeriod(next: RankingPeriod) {
    if (next === period) return
    const nextFilters = { ...draft, period: defaultPeriod(next) }
    setPeriod(next)
    setDraft(nextFilters)
    setApplied(nextFilters)
  }

  return <PanelSection sectionId="admin-high-value-ranking" eyebrow="High value ranking · local preview" title="高价值用户排行" description="按统计周期末的用户价值标签确定入榜资格；使用前须选择一个应用，再按选定指标排行。">
    <div className="high-value-demo-banner" role="status"><strong>本地页面原型 · 全部为演示数据</strong><span>此页面未连接真实收益、绑定或标签历史接口，不可用于运营决策或生产验收。</span></div>
    <nav className="high-value-period-tabs" aria-label="高价值用户排行周期">
      <button type="button" className={period === 'day' ? 'is-active' : ''} aria-pressed={period === 'day'} onClick={() => switchPeriod('day')}>日榜</button>
      <button type="button" className={period === 'week' ? 'is-active' : ''} aria-pressed={period === 'week'} onClick={() => switchPeriod('week')}>周榜</button>
      <button type="button" className={period === 'month' ? 'is-active' : ''} aria-pressed={period === 'month'} onClick={() => switchPeriod('month')}>月榜</button>
    </nav>
    <form className="high-value-filter-grid" onSubmit={applyFilters}>
      <label>应用（必选）<select required value={draft.platform} onChange={(event) => setDraft({ ...draft, platform: event.target.value as Platform | '', guild: 'all' })}><option value="">请选择一个应用</option><option value="LINKY">Linky</option><option value="TIMO">Timo</option></select></label>
      <label>公会<select disabled={!draft.platform} value={draft.guild} onChange={(event) => setDraft({ ...draft, guild: event.target.value })}>{draft.platform ? guilds[draft.platform].map((guild) => <option key={guild.value} value={guild.value}>{guild.label}</option>) : <option value="all">请先选择应用</option>}</select></label>
      <label>统计{period === 'day' ? '日期' : period === 'week' ? '自然周' : '月份'}<input aria-label="统计周期" required type={period === 'day' ? 'date' : period === 'week' ? 'week' : 'month'} value={draft.period} onChange={(event) => setDraft({ ...draft, period: event.target.value })} /></label>
      <label>对接运营<select value={draft.operator} onChange={(event) => setDraft({ ...draft, operator: event.target.value })}><option value="all">全部对接运营</option><option value="demo-a">示例运营 A</option><option value="demo-b">示例运营 B</option></select></label>
      <label>国家／地区（必选）<select required value={draft.country} onChange={(event) => setDraft({ ...draft, country: event.target.value as Country })}>{(Object.keys(countryLabels) as Country[]).map((country) => <option key={country} value={country}>{countryLabels[country]}</option>)}</select></label>
      <label>排行依据<select value={draft.metric} onChange={(event) => setDraft({ ...draft, metric: event.target.value as RankingMetric })}><option value="newInvitees">新增裂变人数</option><option value="directRawDiamonds">直接下级收入（裸钻）</option><option value="selfCommission">自身收入（分佣积分）</option></select></label>
      <button className="primary-btn" type="submit">查询</button>
    </form>
    <div className="high-value-report-meta">
      <span>当前筛选：{periodLabels[period]} · {applied.platform || '未选择应用'} · {applied.platform ? guilds[applied.platform].find((guild) => guild.value === applied.guild)?.label : '暂无公会'} · {countryLabels[applied.country]}</span>
      <span>统计边界：{range ? `${range.start.slice(0, 16).replace('T', ' ')} 至 ${range.end.slice(0, 16).replace('T', ' ')} UTC` : '请选择有效周期'}</span>
      <span>入榜标签：周期结束时为「高价值用户」</span>
      <span>排行依据：{applied.metric === 'newInvitees' ? '新增裂变人数' : applied.metric === 'directRawDiamonds' ? '直接下级收入（裸钻）' : '自身收入（分佣积分）'} · 从高到低</span>
    </div>
    {!applied.platform ? <div className="high-value-empty-state">请先选择 Linky 或 Timo 应用并点击「查询」，再查看当前应用的排行。</div> : <div className="high-value-table-scroll">
      <table className="high-value-ranking-table">
        <thead><tr><th scope="col">排名</th><th scope="col">用户昵称 / ID</th><th scope="col">自身收入<br /><small>分佣积分</small></th><th scope="col">直接下级收入<br /><small>MCN 已确认裸钻</small></th><th scope="col">新增裂变人数<br /><small>直属成功绑定</small></th></tr></thead>
        <tbody>{rows.map((row, index) => <tr key={row.id}><td><span className={`high-value-rank high-value-rank-${index + 1}`}>{index + 1}</span></td><td><strong>{row.nickname}</strong><small>{row.id}</small></td><td className={applied.metric === 'selfCommission' ? 'high-value-primary-number' : undefined}>{formatNumber(row.selfCommission)}</td><td className={applied.metric === 'directRawDiamonds' ? 'high-value-primary-number' : undefined}>{formatNumber(row.directRawDiamonds)}</td><td className={applied.metric === 'newInvitees' ? 'high-value-primary-number' : undefined}>{row.newInvitees}</td></tr>)}</tbody>
      </table>
    </div>}
    <p className="high-value-footnote">待接入真实数据：自身收入仅含直接、间接下级带来的实际分佣积分，不含本人在应用内的原始收入；直接下级收入仅汇总所选应用及公会范围内直属下级的 MCN 已确认、分成前钻石。选择「全部公会」仍只汇总当前应用。新增裂变人数按本周期内直属下级首次成功绑定当前应用计数。历史业绩按业务事件发生时的对接运营归属，不因后续转交回写。</p>
  </PanelSection>
}
