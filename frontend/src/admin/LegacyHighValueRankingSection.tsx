import { useState, type FormEvent } from 'react'
import { PanelSection } from './LegacyPresentation'
import { isoWeek, utcPeriodRange, type RankingPeriod } from './highValueRankingModel'
import './LegacyHighValueRankingSection.css'

type Platform = 'LINKY' | 'TIMO'
type Country = 'BR' | 'ID' | 'MX' | 'CN' | 'HK'
type Filters = { platform: Platform; guild: string; period: string; operator: string; country: Country }

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
  if (period === 'month') date.setUTCMonth(date.getUTCMonth() - 1)
  return period === 'day' ? date.toISOString().slice(0, 10) : period === 'week' ? isoWeek(date) : date.toISOString().slice(0, 7)
}

type DemoRow = { id: string; nickname: string; self: number; direct: number; indirect: number; newInvitees: number }
const baseRows: DemoRow[] = [
  { id: 'DEMO-1003', nickname: '示例用户 C', self: 12840, direct: 2910, indirect: 880, newInvitees: 8 },
  { id: 'DEMO-1001', nickname: '示例用户 A', self: 10560, direct: 3680, indirect: 1250, newInvitees: 11 },
  { id: 'DEMO-1005', nickname: '示例用户 E', self: 8960, direct: 1740, indirect: 620, newInvitees: 5 },
  { id: 'DEMO-1002', nickname: '示例用户 B', self: 6820, direct: 2340, indirect: 430, newInvitees: 6 },
  { id: 'DEMO-1004', nickname: '示例用户 D', self: 4510, direct: 860, indirect: 220, newInvitees: 3 },
]

function demoRows(filters: Filters, period: RankingPeriod): DemoRow[] {
  const multiplier = period === 'day' ? 1 : period === 'week' ? 5 : 18
  const appFactor = filters.platform === 'LINKY' ? 1 : 0.82
  const countryFactor: Record<Country, number> = { BR: 1, ID: 0.92, MX: 0.78, CN: 0.68, HK: 0.56 }
  const factor = multiplier * appFactor * countryFactor[filters.country] * (filters.guild === 'all' ? 1 : 0.67) * (filters.operator === 'all' ? 1 : 0.72)
  return baseRows.map((row) => ({
    ...row,
    self: Math.round(row.self * factor),
    direct: Math.round(row.direct * factor),
    indirect: Math.round(row.indirect * factor),
    newInvitees: Math.round(row.newInvitees * Math.max(1, factor / 2)),
  })).sort((left, right) => right.self - left.self || left.id.localeCompare(right.id))
}

const diamonds = (value: number) => value.toLocaleString('zh-CN')

export default function LegacyHighValueRankingSection({ period }: { period: RankingPeriod }) {
  const [draft, setDraft] = useState<Filters>(() => ({ platform: 'LINKY', guild: 'all', period: defaultPeriod(period), operator: 'all', country: 'BR' }))
  const [applied, setApplied] = useState(draft)
  const range = utcPeriodRange(period, applied.period)
  const rows = demoRows(applied, period)

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (utcPeriodRange(period, draft.period)) setApplied(draft)
  }

  return <PanelSection sectionId={`admin-high-value-${period}`} eyebrow="High value ranking · local preview" title={`高价值用户排行 · ${periodLabels[period]}`} description="按统计周期末的用户价值标签确定入榜资格，暂按自身收入（钻石）降序排列。">
    <div className="high-value-demo-banner" role="status"><strong>本地页面原型 · 全部为演示数据</strong><span>此页面未连接真实收益、绑定或标签历史接口，不可用于运营决策或生产验收。</span></div>
    <nav className="high-value-period-tabs" aria-label="高价值用户排行周期">
      <a className={period === 'day' ? 'is-active' : ''} href="#admin-high-value-day">日榜</a>
      <a className={period === 'week' ? 'is-active' : ''} href="#admin-high-value-week">周榜</a>
      <a className={period === 'month' ? 'is-active' : ''} href="#admin-high-value-month">月榜</a>
    </nav>
    <form className="high-value-filter-grid" onSubmit={applyFilters}>
      <label>应用<select value={draft.platform} onChange={(event) => setDraft({ ...draft, platform: event.target.value as Platform, guild: 'all' })}><option value="LINKY">Linky</option><option value="TIMO">Timo</option></select></label>
      <label>公会<select value={draft.guild} onChange={(event) => setDraft({ ...draft, guild: event.target.value })}>{guilds[draft.platform].map((guild) => <option key={guild.value} value={guild.value}>{guild.label}</option>)}</select></label>
      <label>统计{period === 'day' ? '日期' : period === 'week' ? '自然周' : '月份'}<input aria-label="统计周期" required type={period === 'day' ? 'date' : period === 'week' ? 'week' : 'month'} value={draft.period} onChange={(event) => setDraft({ ...draft, period: event.target.value })} /></label>
      <label>对接运营<select value={draft.operator} onChange={(event) => setDraft({ ...draft, operator: event.target.value })}><option value="all">全部对接运营</option><option value="demo-a">示例运营 A</option><option value="demo-b">示例运营 B</option></select></label>
      <label>国家／地区（必选）<select required value={draft.country} onChange={(event) => setDraft({ ...draft, country: event.target.value as Country })}>{(Object.keys(countryLabels) as Country[]).map((country) => <option key={country} value={country}>{countryLabels[country]}</option>)}</select></label>
      <button className="primary-btn" type="submit">查询</button>
    </form>
    <div className="high-value-report-meta">
      <span>当前筛选：{applied.platform} · {guilds[applied.platform].find((guild) => guild.value === applied.guild)?.label} · {countryLabels[applied.country]}</span>
      <span>统计边界：{range ? `${range.start.slice(0, 16).replace('T', ' ')} 至 ${range.end.slice(0, 16).replace('T', ' ')} UTC` : '请选择有效周期'}</span>
      <span>入榜标签：周期结束时为「高价值用户」</span>
    </div>
    <div className="high-value-table-scroll">
      <table className="high-value-ranking-table">
        <thead><tr><th scope="col">排名</th><th scope="col">用户昵称 / ID</th><th scope="col">自身收入<br /><small>钻石</small></th><th scope="col">直接下级收入<br /><small>分成后钻石</small></th><th scope="col">间接下级收入<br /><small>分成后钻石</small></th><th scope="col">下级累计收入<br /><small>钻石</small></th><th scope="col">新增直属下级<br /><small>成功绑定人数</small></th></tr></thead>
        <tbody>{rows.map((row, index) => <tr key={row.id}><td><span className={`high-value-rank high-value-rank-${index + 1}`}>{index + 1}</span></td><td><strong>{row.nickname}</strong><small>{row.id}</small></td><td className="high-value-primary-number">{diamonds(row.self)}</td><td>{diamonds(row.direct)}</td><td>{diamonds(row.indirect)}</td><td>{diamonds(row.direct + row.indirect)}</td><td>{row.newInvitees}</td></tr>)}</tbody>
      </table>
    </div>
    <p className="high-value-footnote">口径待接入：自身收入为本人已确认收益；直接/间接下级收入为分成后归属本人的钻石，累计值为两者之和；新增直属下级按本周期内首次成功绑定计数。历史业绩按业务事件发生时的对接运营归属，不因后续转交回写。</p>
  </PanelSection>
}
