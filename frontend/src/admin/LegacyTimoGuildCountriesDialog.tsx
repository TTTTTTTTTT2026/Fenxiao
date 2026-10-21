import { useEffect, useState } from 'react'
import { getAdminTimoGuildCountries, saveAdminTimoGuildCountries, type TimoGuildCountryAccessResponse } from '../api'
import ConfirmDialog from './LegacyConfirmDialog'
import { InlineHint, RelationItem } from './LegacyPresentation'
import './LegacyTimoGuildCountriesDialog.css'

export function TimoGuildCountryFields({ value, selected, disabled, onChange }: {
  value: TimoGuildCountryAccessResponse; selected: string[]; disabled: boolean; onChange: (countries: string[]) => void
}) {
  return <>
    <div className="relation-grid"><RelationItem label="公会名称" value={value.guildName} />
      <RelationItem label="官方公会 ID" value={value.guildId} /><RelationItem label="公会所属国家（MCN，只读）" value={value.mcnCountry || '-'} /></div>
    <fieldset className="timo-guild-country-options" disabled={disabled}><legend>可接纳用户国家（多选）</legend>
      {value.countryOptions.map(country => <label key={country.code} className="checkbox-label">
        <input type="checkbox" checked={selected.includes(country.code)} onChange={() => onChange(selected.includes(country.code)
          ? selected.filter(code => code !== country.code) : [...selected, country.code])} />{country.name}（{country.code}）</label>)}
    </fieldset>
    <InlineHint text="保存后仅调整后续绑定和再次核验的范围，不修改MCN公会国家、用户归属国家、已通过绑定或历史收益。MCN同步不会覆盖此配置。" />
    <InlineHint text="接纳国家不等于已配置该国分佣规则；不得将用户自动改为墨西哥归属。" />
  </>
}

export default function LegacyTimoGuildCountriesDialog({ token, guildId, onClose, onSaved }: {
  token: string; guildId: string; onClose: () => void; onSaved: (value: TimoGuildCountryAccessResponse) => void
}) {
  const [value, setValue] = useState<TimoGuildCountryAccessResponse | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [busy, setBusy] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const [emptyConfirmed, setEmptyConfirmed] = useState(false)
  useEffect(() => {
    let active = true
    getAdminTimoGuildCountries(token, guildId).then(result => {
      if (active) { setValue(result); setSelected(result.countryCodes); setError(''); setEmptyConfirmed(false) }
    }).catch(err => { if (active) setError(err instanceof Error ? err.message : '读取接纳国家失败') })
      .finally(() => { if (active) setBusy(false) })
    return () => { active = false }
  }, [token, guildId, reload])
  async function save() {
    if (!value || busy || (!selected.length && !emptyConfirmed)) return
    setBusy(true); setSaving(true); setError('')
    try { onSaved(await saveAdminTimoGuildCountries(token, guildId, value.version, selected)) }
    catch (err) { setError(err instanceof Error ? err.message : '保存接纳国家失败') }
    finally { setBusy(false); setSaving(false) }
  }
  return <ConfirmDialog title="配置接纳国家 · Timo" tone="primary" className="timo-guild-countries-dialog" confirmText="保存接纳国家" loading={saving}
    confirmDisabled={busy || !value || (!selected.length && !emptyConfirmed)} onCancel={onClose} onConfirm={() => void save()}>
    {error ? <p role="alert" className="form-error">{error}</p> : null}
    <button className="ghost-btn small-btn" disabled={busy} onClick={() => { setBusy(true); setValue(null); setReload(reload + 1) }}>重新读取配置</button>
    {value ? <TimoGuildCountryFields value={value} selected={selected} disabled={busy} onChange={codes => { setSelected(codes); setEmptyConfirmed(false) }} /> : <p>{busy ? '正在读取接纳国家…' : '未能读取配置，请重试。'}</p>}
    {value && !selected.length ? <label className="checkbox-label"><input type="checkbox" checked={emptyConfirmed} disabled={busy}
      onChange={event => setEmptyConfirmed(event.target.checked)} />确认清空：此公会将不再接纳新的绑定核验，原已通过绑定保持不变。</label> : null}
  </ConfirmDialog>
}
