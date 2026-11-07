import { useEffect, useState, type FormEvent } from 'react'
import { replaceTimoInvitationArtwork, timoArtworkLocales, timoInvitationArtworkUrl } from '../timoInvitationArtwork'
import type { ConsumerLocale } from '../shared/catalog'

export default function TimoInvitationArtworkSection({ token }: { token: string }) {
  const [locale, setLocale] = useState<ConsumerLocale>('zh')
  const [version, setVersion] = useState(0)
  const [unavailableUrl, setUnavailableUrl] = useState('')
  const [candidate, setCandidate] = useState<{ file: File; url: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const previewUrl = `${timoInvitationArtworkUrl(locale)}?v=${version}`

  useEffect(() => {
    if (!candidate) return
    return () => URL.revokeObjectURL(candidate.url)
  }, [candidate])

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!candidate || busy) return
    setBusy(true)
    setError('')
    setSaved(false)
    try {
      await replaceTimoInvitationArtwork(locale, candidate.file, token)
      setVersion((value) => value + 1)
      setUnavailableUrl('')
      setCandidate(null)
      setSaved(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '图片保存失败。')
    } finally {
      setBusy(false)
    }
  }

  return <section className="panel">
    <h2>Timo 邀请主图</h2>
    <p>用于「赚钱」页的 Timo 绑定引导。保存后对应语言会使用新图。图片建议使用横向 3:2，支持 PNG 或 JPEG，最大 1 MiB，单边不超过 2400 像素。</p>
    <form onSubmit={(event) => void save(event)}>
      <fieldset disabled={busy}>
        <legend>按语言维护图片</legend>
        <label>图片语言 <select value={locale} onChange={(event) => {
          setLocale(event.target.value as ConsumerLocale)
          setCandidate(null)
          setSaved(false)
          setError('')
        }}>
          {Object.entries(timoArtworkLocales).map(([key, title]) => <option key={key} value={key}>{title}</option>)}
        </select></label>
        <p><label>选择图片 <input key={`${locale}:${version}`} type="file" accept="image/png,image/jpeg" onChange={(event) => {
          const file = event.target.files?.[0]
          setCandidate(file ? { file, url: URL.createObjectURL(file) } : null)
          setSaved(false)
          setError('')
        }} /></label></p>
        {candidate ? <img src={candidate.url} alt="待保存的主图预览" style={{ display: 'block', maxWidth: '100%', maxHeight: 200, marginBottom: 12 }} /> : null}
        <button className="primary-btn" type="submit" disabled={!candidate || busy}>{busy ? '保存中…' : '保存并替换主图'}</button>
      </fieldset>
    </form>
    {error ? <p role="alert">{error}</p> : null}
    {saved ? <p role="status">已保存，当前语言使用新图。</p> : null}
    <h3>当前主图</h3>
    {unavailableUrl === previewUrl
      ? <p>当前图片不可用，赚钱页将显示默认主图。</p>
      : <img key={previewUrl} src={previewUrl} onError={() => setUnavailableUrl(previewUrl)} alt={`${timoArtworkLocales[locale]} Timo 邀请主图`} style={{ display: 'block', maxWidth: '100%', maxHeight: 320 }} />}
  </section>
}
