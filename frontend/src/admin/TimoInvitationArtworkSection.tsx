import { useEffect, useRef, useState, type FormEvent } from 'react'
import { replaceTimoInvitationArtwork, timoArtworkLocales, timoInvitationArtworkUrl } from '../timoInvitationArtwork'
import type { ConsumerLocale } from '../shared/catalog'
import './TimoInvitationArtworkSection.css'

const moduleName = '赚钱页 Timo 主图'
const locales = Object.keys(timoArtworkLocales) as ConsumerLocale[]

type Draft = { file: File; url: string }
type UploadState = { version?: number; draft?: Draft; error?: string }

function ArtworkUpload({ locale, state, busy, onSelect }: {
  locale: ConsumerLocale; state: UploadState; busy: boolean; onSelect: (file?: File) => void
}) {
  const [unavailableUrl, setUnavailableUrl] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const { version = 0, draft, error } = state
  const currentUrl = `${timoInvitationArtworkUrl(locale)}?v=${version}`
  const language = timoArtworkLocales[locale]

  useEffect(() => {
    if (draft) return () => URL.revokeObjectURL(draft.url)
  }, [draft])

  return <div className="artwork-upload">
    <div className="artwork-upload-heading">
      <h4>{language}</h4>
      {draft ? <span>待保存</span> : version > 0 && !error ? <span role="status">已保存</span> : null}
    </div>
    <div className="artwork-preview">
      {draft ? <img src={draft.url} alt={`${language}待保存预览`} />
        : unavailableUrl === currentUrl ? <span>使用默认主图</span>
          : <img key={currentUrl} src={currentUrl} alt={`${language}当前主图`} onError={() => setUnavailableUrl(currentUrl)} />}
    </div>
    <input key={version} ref={input} type="file" disabled={busy} aria-label={`${language}上传主图`} accept="image/png,image/jpeg"
      onChange={(event) => onSelect(event.target.files?.[0])} />
    {draft ? <button type="button" className="artwork-reset" disabled={busy} onClick={() => {
      if (input.current) input.current.value = ''
      onSelect()
    }}>撤销选择</button> : null}
    {error ? <p className="artwork-error" role="alert">{error}</p> : null}
  </div>
}

function ArtworkEditor({ token, open, onClose }: { token: string; open: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [uploads, setUploads] = useState<Partial<Record<ConsumerLocale, UploadState>>>({})
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState('')
  const selectedCount = locales.filter(locale => uploads[locale]?.draft).length

  useEffect(() => {
    if (!open) return
    const element = dialog.current
    element?.showModal()
    return () => element?.close()
  }, [open])

  function selectFile(locale: ConsumerLocale, file?: File) {
    const tooLarge = file && file.size > 1024 * 1024
    const draft = file && !tooLarge ? { file, url: URL.createObjectURL(file) } : undefined
    setUploads(current => ({
      ...current,
      [locale]: { version: current[locale]?.version, draft, error: tooLarge ? '图片不能超过 1 MiB。' : undefined },
    }))
    setFeedback('')
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedCount || busy) return
    setBusy(true)
    setFeedback('')
    const pending = locales.flatMap(locale => {
      const draft = uploads[locale]?.draft
      return draft ? [{ locale, file: draft.file }] : []
    })
    const results = await Promise.allSettled(pending.map(({ locale, file }) => replaceTimoInvitationArtwork(locale, file, token)))
    const savedCount = results.filter(result => result.status === 'fulfilled').length

    setUploads(current => {
      const next = { ...current }
      pending.forEach(({ locale }, index) => {
        const result = results[index]
        next[locale] = result.status === 'fulfilled'
          ? { version: (current[locale]?.version ?? 0) + 1 }
          : { ...current[locale], error: result.reason instanceof Error ? result.reason.message : '图片保存失败。' }
      })
      return next
    })
    setFeedback(savedCount === pending.length ? `已保存 ${savedCount} 张主图。`
      : `已保存 ${savedCount} 张，${pending.length - savedCount} 张未保存。可重试未保存的图片。`)
    setBusy(false)
  }

  return <dialog ref={dialog} className="artwork-dialog" aria-labelledby="artwork-editor-title" onCancel={event => {
    event.preventDefault()
    if (!busy) onClose()
  }}>
    <form onSubmit={event => void save(event)}>
      <header className="artwork-dialog-header">
        <h3 id="artwork-editor-title">编辑{moduleName}</h3>
        <p>按语言选择要替换的图片。支持 PNG 或 JPEG，最大 1 MiB，单边不超过 2400 像素。建议使用横向 3:2。</p>
      </header>
      <div className="artwork-upload-grid" role="group" aria-label="按语言上传主图">
        {locales.map(locale => <ArtworkUpload key={locale} locale={locale} state={uploads[locale] ?? {}} busy={busy}
          onSelect={file => selectFile(locale, file)} />)}
      </div>
      <footer className="artwork-dialog-footer">
        <p role="status">{feedback || (selectedCount ? `已选 ${selectedCount} 张待保存` : '请选择要替换的图片。')}</p>
        <div className="artwork-dialog-actions">
          <button type="button" disabled={busy} onClick={onClose}>关闭</button>
          <button className="artwork-primary-button" type="submit" disabled={!selectedCount || busy}>{busy ? '保存中…' : '保存所选图片'}</button>
        </div>
      </footer>
    </form>
  </dialog>
}

export default function TimoInvitationArtworkSection({ token }: { token: string }) {
  const [editor, setEditor] = useState<'open' | 'closed' | null>(null)
  return <section className="panel artwork-management">
    <h2>下发模块</h2>
    <table>
      <thead><tr><th scope="col">模块名称</th><th scope="col">操作</th></tr></thead>
      <tbody><tr>
        <th scope="row">{moduleName}</th>
        <td><button type="button" className="artwork-primary-button" aria-haspopup="dialog" aria-label={`编辑${moduleName}`} onClick={() => setEditor('open')}>编辑</button></td>
      </tr></tbody>
    </table>
    {editor ? <ArtworkEditor token={token} open={editor === 'open'} onClose={() => setEditor('closed')} /> : null}
  </section>
}
