import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { PanelSection } from './LegacyPresentation'
import { getPointCurrencyRates, getPointCurrencyHistory, previewPointCurrency, savePointCurrencyRate,
  type PointCurrencyDashboard, type PointCurrencyHistory, type PointCurrencyQuote, type PointCurrencySetting } from './pointCurrencyApi'
import { formatPointCurrencyAmount, pointCurrencySavePayload, pointCurrencyStatus, validPointCurrencyDecimal } from './pointCurrencyModel'
import './LegacyPointCurrencySection.css'

const time = (value: string) => new Date(value).toLocaleString('zh-CN', { timeZone: 'UTC', hour12: false }) + ' UTC'
const errorText = (error: unknown) => error instanceof Error ? error.message : '请求失败，请重试。'

function PointCurrencyModal({ children, title, onClose, blocked = false, wide = false }: { children: ReactNode; title: string; onClose: () => void; blocked?: boolean; wide?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close() }, [])
  return <dialog ref={dialog} className={`pointfx-dialog${wide ? ' pointfx-history' : ''}`} aria-label={title}
    onCancel={event => { event.preventDefault(); if (!blocked) onClose() }}>{children}</dialog>
}

export function PointCurrencySettingsTable({ settings, onEdit, onHistory }: {
  settings: PointCurrencySetting[]; onEdit: (setting: PointCurrencySetting) => void; onHistory: (setting: PointCurrencySetting) => void
}) {
  return <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>归属国家／地区</th><th>对应货币</th><th>每 1 积分参考金额</th><th>当前状态／生效时间</th><th>待生效预约</th><th>操作</th></tr></thead>
    <tbody>{settings.map(setting => <tr key={setting.country.countryCode}>
      <td>{setting.country.countryName}<small className="table-subtle">{setting.country.countryCode}</small></td>
      <td>{setting.country.currencyCode}</td><td>{setting.current?.enabled ? `${setting.current.currencyPerPoint} ${setting.country.currencyCode}` : '—'}</td>
      <td>{setting.current ? pointCurrencyStatus[setting.current.status] : '未配置'}{setting.current && <small className="table-subtle">V{setting.current.version} · {time(setting.current.effectiveAt)}</small>}</td>
      <td>{setting.scheduled ? <>{setting.scheduled.enabled ? `${setting.scheduled.currencyPerPoint} ${setting.country.currencyCode}` : '停用'}<small className="table-subtle">{time(setting.scheduled.effectiveAt)}</small></> : '—'}</td>
      <td><div className="action-row"><button className="primary-btn small-btn" onClick={() => onEdit(setting)}>设置</button><button className="ghost-btn small-btn" onClick={() => onHistory(setting)}>版本历史</button></div></td>
    </tr>)}</tbody></table></div>
}

export function PointCurrencyQuoteResult({ quote }: { quote: PointCurrencyQuote }) {
  if (!quote.referenceOnly) return <p role="alert">接口未明确参考用途，本次不展示金额。</p>
  return <div className="pointfx-result" role="status"><strong>{quote.status === 'CONFIGURED' && quote.amount != null
    ? `参考金额：${formatPointCurrencyAmount(quote.amount)} ${quote.currencyCode}` : pointCurrencyStatus[quote.status]}</strong>
    <span>归属国家：{quote.countryCode || '未记录'} · 对应货币：{quote.currencyCode || '未确定'} · {quote.points} 积分</span>
    {quote.status === 'CONFIGURED' && <span>每 1 积分 = {quote.currencyPerPoint} {quote.currencyCode} · 汇率版本 #{quote.rateVersionId}</span>}
    <small>仅供参考，不代表可提现金额或实际结算价格；积分余额不会变化。</small></div>
}

export default function LegacyPointCurrencySection({ sessionToken }: { sessionToken: string }) {
  const [result, setResult] = useState<{ data: PointCurrencyDashboard | null; error: string }>({ data: null, error: '' })
  const [revision, setRevision] = useState(0)
  const [editing, setEditing] = useState<PointCurrencySetting | null>(null)
  const [form, setForm] = useState({ rate: '', enabled: true, effectiveAt: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'country' | 'user'>('country')
  const [preview, setPreview] = useState({ points: '', country: 'ID', userId: '' })
  const [quote, setQuote] = useState<PointCurrencyQuote | null>(null)
  const [calculating, setCalculating] = useState(false)
  const [history, setHistory] = useState<{ setting: PointCurrencySetting; data: PointCurrencyHistory | null; loading: boolean } | null>(null)
  const historyRevision = useRef(0)
  useEffect(() => {
    const abort = new AbortController()
    void getPointCurrencyRates(sessionToken, abort.signal).then(data => {
      if (!abort.signal.aborted) setResult({ data, error: '' })
    }).catch(error => { if (!abort.signal.aborted) setResult({ data: null, error: errorText(error) }) })
    return () => abort.abort()
  }, [sessionToken, revision])
  function refresh() { setResult({ data: null, error: '' }); setQuote(null); setRevision(n => n + 1) }
  function edit(setting: PointCurrencySetting) {
    const value = setting.scheduled || setting.current
    setEditing(setting); setForm({ rate: value?.currencyPerPoint || '', enabled: value?.enabled ?? true, effectiveAt: '' }); setError(''); setMessage('')
  }
  async function save(event: FormEvent) {
    event.preventDefault()
    if (!editing) return
    setError(''); setMessage('')
    try {
      const payload = pointCurrencySavePayload(new FormData(event.currentTarget as HTMLFormElement), editing.latestVersion)
      setSaving(true)
      await savePointCurrencyRate(sessionToken, editing.country.countryCode, payload)
      setEditing(null); setMessage('参考汇率已保存。未改变任何积分余额或提现状态。'); refresh()
    } catch (error) { setError(errorText(error)) } finally { setSaving(false) }
  }
  async function calculate(event: FormEvent) {
    event.preventDefault(); setQuote(null); setError(''); setMessage('')
    if (!validPointCurrencyDecimal(preview.points, 6, false)) { setError('积分须为非负数，最多12位整数和6位小数。'); return }
    if (mode === 'user' && (!/^\d{1,18}$/.test(preview.userId) || !/[1-9]/.test(preview.userId))) { setError('请输入有效用户ID。'); return }
    setCalculating(true)
    try { setQuote(await previewPointCurrency(sessionToken, mode === 'user' ? { points: preview.points, userId: preview.userId } : { points: preview.points, countryCode: preview.country })) }
    catch (error) { setError(errorText(error)) } finally { setCalculating(false) }
  }
  async function showHistory(setting: PointCurrencySetting, more = false) {
    const current = ++historyRevision.current
    const previous = more ? history?.data ?? null : null
    setError(''); setHistory({ setting, data: previous, loading: true })
    try {
      const data = await getPointCurrencyHistory(sessionToken, setting.country.countryCode, previous?.nextBeforeVersion)
      if (current === historyRevision.current) setHistory({ setting, data: { ...data, items: [...(previous?.items || []), ...data.items] }, loading: false })
    } catch (error) { if (current === historyRevision.current) { setHistory(null); setError(errorText(error)) } }
  }
  return <PanelSection sectionId="admin-point-currency-rates" eyebrow="Finance · reference only" title="积分货币汇率"
    description="按当前归属国家将积分换算为当地货币参考金额，不修改积分，不开放提现。" action={<button className="ghost-btn" onClick={refresh} disabled={saving || calculating}>刷新配置</button>}>
    <div className="pointfx">
      <p className="pointfx-notice">这是独立于钻石兑积分的参考汇率。用户归属国家更正后，参考币种随之切换；语言、IP、手机号区号和应用切换不改变币种。</p>
      {error && <div className="pointfx-error" role="alert">{error}</div>}{message && <div className="pointfx-result" role="status">{message}</div>}
      {result.error ? <p role="alert">配置读取失败：{result.error}。未将失败当作未配置或零金额。</p> : result.data ? <PointCurrencySettingsTable settings={result.data.settings} onEdit={edit} onHistory={setting => void showHistory(setting)} /> : <p role="status">正在读取汇率配置…</p>}
      <section className="pointfx-preview"><h3>参考金额试算</h3><p>手工输入积分，仅验证计算；不是读取该用户的实际余额，不生成结算记录。</p>
        <form onSubmit={calculate}><fieldset disabled={calculating || saving}><div className="pointfx-fields">
          <label>试算方式<select value={mode} onChange={e => { setMode(e.target.value as 'country' | 'user'); setQuote(null) }}><option value="country">按国家试算</option><option value="user">按用户当前归属试算</option></select></label>
          {mode === 'country' ? <label>归属国家<select aria-label="试算归属国家" value={preview.country} onChange={e => { setPreview({ ...preview, country: e.target.value }); setQuote(null) }}>{(result.data?.settings || []).map(s => <option key={s.country.countryCode} value={s.country.countryCode}>{s.country.countryName} · {s.country.currencyCode}</option>)}</select></label>
            : <label>用户 ID<input aria-label="试算用户ID" value={preview.userId} inputMode="numeric" onChange={e => { setPreview({ ...preview, userId: e.target.value }); setQuote(null) }} placeholder="由后端读取当前归属国家" /></label>}
          <label>试算积分<input aria-label="试算积分" value={preview.points} inputMode="decimal" onChange={e => { setPreview({ ...preview, points: e.target.value }); setQuote(null) }} placeholder="请输入积分" /></label>
          <button className="primary-btn" type="submit" disabled={!result.data}>{calculating ? '计算中…' : '计算参考金额'}</button>
        </div></fieldset></form>{quote && <PointCurrencyQuoteResult quote={quote} />}
      </section>
      {editing && <PointCurrencyModal title="设置参考汇率" onClose={() => setEditing(null)} blocked={saving}><h3 id="pointfx-edit-title">设置 {editing.country.countryName} · {editing.country.currencyCode}</h3>
        <form onSubmit={save}><fieldset disabled={saving || calculating}><div className="pointfx-fields">
          <label>配置状态<select name="enabled" aria-label="汇率配置状态" value={form.enabled ? 'enabled' : 'disabled'} onChange={e => setForm({ ...form, enabled: e.target.value === 'enabled' })}><option value="enabled">启用</option><option value="disabled">停用</option></select></label>
          <label>每 1 积分对应 {editing.country.currencyCode}<input name="rate" autoFocus aria-label="每积分货币金额" inputMode="decimal" value={form.rate} onChange={e => setForm({ ...form, rate: e.target.value })} placeholder="填写经业务确认的比例" /></label>
          <label>生效时间（本机时间）<input name="effectiveAt" aria-label="汇率生效时间" type="datetime-local" value={form.effectiveAt} onChange={e => setForm({ ...form, effectiveAt: e.target.value })} /></label>
        </div><p>留空立即生效；填写未来时间则预约生效。保存会取消该国家已有的未生效预约；历史版本保留。货币固定对应国家，不允许自行改成美元。</p>
        <p>仅参考估值，不修改用户积分、不执行支付。</p>
        {error && <p role="alert" className="pointfx-error">{error}</p>}
        <div className="action-row"><button className="primary-btn" type="submit">{saving ? '保存中…' : '确认保存参考汇率'}</button><button className="ghost-btn" type="button" onClick={() => setEditing(null)}>取消</button></div></fieldset></form>
      </PointCurrencyModal>}
      {history && <PointCurrencyModal title="汇率版本历史" wide onClose={() => { historyRevision.current++; setHistory(null) }}><header><h3>{history.setting.country.countryName} · {history.setting.country.currencyCode} 版本历史</h3><button className="ghost-btn" onClick={() => { historyRevision.current++; setHistory(null) }}>关闭</button></header>
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>版本</th><th>每积分金额</th><th>启停／状态</th><th>生效时间</th><th>创建人／时间</th></tr></thead><tbody>{history.data?.items.map(r => <tr key={r.id}><td>V{r.version}</td><td>{r.currencyPerPoint ?? '—'} {history.setting.country.currencyCode}</td><td>{r.enabled ? '启用' : '停用'} · {pointCurrencyStatus[r.status]}</td><td>{time(r.effectiveAt)}</td><td>#{r.createdBy}<small className="table-subtle">{time(r.createdAt)}</small></td></tr>)}</tbody></table></div>
        {history.loading ? <p role="status">读取版本历史…</p> : !history.data?.items.length ? <p>尚未配置，没有历史版本。</p> : history.data.nextBeforeVersion ? <button className="ghost-btn" onClick={() => void showHistory(history.setting, true)}>加载更早版本</button> : null}
      </PointCurrencyModal>}
    </div>
  </PanelSection>
}
