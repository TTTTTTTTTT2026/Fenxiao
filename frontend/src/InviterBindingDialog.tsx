import { useEffect, useRef, useState, type FormEvent } from 'react'
import { submitInviteeBinding, type InvitationProgressResponse } from './api'
import type { ConsumerLocale } from './shared/catalog'

type Item = InvitationProgressResponse['items'][number]
const copy = {
  zh: { title: '协助绑定', user: '被邀请人', phone: '注册手机号', hint: '请输入被邀请人本人的应用数字 ID，账号将绑定到该被邀请人名下。', account: '被邀请人的', submit: '提交核验', busy: '正在提交核验…', close: '关闭', success: '核验通过，已绑定到被邀请人名下。', pending: '已提交，核验尚未完成。请稍后查看进展；持续未完成时联系运营协助。', rejected: '核验未通过，请核对本人 ID 和目标公会，并通过原有纠错流程处理。', error: '提交未完成，请刷新进展确认状态后再操作。', qualification: '你需要先成功绑定这个应用，才能协助被邀请人。', relation: '邀请关系已变化，无法为这位用户提交。', existing: '该用户已有提交记录，请刷新查看进展。', digits: '请输入正确位数的数字 ID。' },
  en: { title: 'Help bind', user: 'Invitee', phone: 'Registered phone', hint: 'Enter the invitee’s own numeric app ID. The account will belong to this invitee.', account: 'Invitee’s', submit: 'Submit for verification', busy: 'Submitting…', close: 'Close', success: 'Verified and bound to the invitee.', pending: 'Submitted; verification is not complete. Check progress later, or contact support if it remains pending.', rejected: 'Not verified. Check the invitee’s ID and target guild, then use the existing correction process.', error: 'Submission could not be confirmed. Refresh progress before trying again.', qualification: 'Verify your own binding for this app before helping an invitee.', relation: 'The invitation relationship changed. You cannot submit for this user.', existing: 'This user already has a submission. Refresh progress.', digits: 'Enter a numeric ID with the correct number of digits.' },
  es: { title: 'Ayudar a vincular', user: 'Persona invitada', phone: 'Teléfono registrado', hint: 'Introduce el ID numérico de la persona invitada. La cuenta se vinculará a esa persona.', account: 'ID de la persona invitada en', submit: 'Enviar para verificar', busy: 'Enviando…', close: 'Cerrar', success: 'Verificado y vinculado a la persona invitada.', pending: 'Enviado; la verificación está pendiente. Consulta el progreso más tarde o contacta con soporte.', rejected: 'No verificado. Revisa el ID y el gremio y utiliza el proceso de corrección existente.', error: 'No se pudo confirmar el envío. Actualiza el progreso antes de reintentar.', qualification: 'Primero debes verificar tu propia cuenta en esta aplicación.', relation: 'La relación de invitación cambió. No puedes realizar este envío.', existing: 'Esta persona ya tiene un envío. Actualiza el progreso.', digits: 'Introduce un ID numérico con la cantidad correcta de dígitos.' },
  id: { title: 'Bantu hubungkan', user: 'Pengguna yang diundang', phone: 'Nomor terdaftar', hint: 'Masukkan ID angka milik pengguna yang diundang. Akun akan dihubungkan ke pengguna tersebut.', account: 'ID pengguna yang diundang di', submit: 'Kirim untuk verifikasi', busy: 'Mengirim…', close: 'Tutup', success: 'Terverifikasi dan terhubung ke pengguna yang diundang.', pending: 'Terkirim; verifikasi belum selesai. Periksa progres nanti atau hubungi petugas.', rejected: 'Belum lolos verifikasi. Periksa ID dan guild lalu ikuti proses koreksi yang tersedia.', error: 'Pengiriman belum dapat dikonfirmasi. Muat ulang progres sebelum mencoba lagi.', qualification: 'Verifikasi akun Anda di aplikasi ini sebelum membantu pengguna lain.', relation: 'Hubungan undangan telah berubah. Anda tidak dapat mengirim untuk pengguna ini.', existing: 'Pengguna ini sudah mengirim ID. Muat ulang progres.', digits: 'Masukkan ID angka dengan jumlah digit yang sesuai.' },
  pt: { title: 'Ajudar a vincular', user: 'Pessoa convidada', phone: 'Telefone cadastrado', hint: 'Digite o ID numérico da própria pessoa convidada. A conta será vinculada a essa pessoa.', account: 'ID da pessoa convidada no', submit: 'Enviar para verificação', busy: 'Enviando…', close: 'Fechar', success: 'Verificado e vinculado à pessoa convidada.', pending: 'Enviado; a verificação ainda não terminou. Consulte o progresso depois ou contate o suporte.', rejected: 'Não verificado. Confira o ID e a guilda e siga o processo de correção existente.', error: 'Não foi possível confirmar o envio. Atualize o progresso antes de tentar novamente.', qualification: 'Verifique sua própria conta neste aplicativo antes de ajudar outra pessoa.', relation: 'A relação de convite mudou. Você não pode enviar para esta pessoa.', existing: 'Esta pessoa já enviou um ID. Atualize o progresso.', digits: 'Digite um ID numérico com a quantidade correta de dígitos.' },
} satisfies Record<ConsumerLocale, Record<string, string>>

export default function InviterBindingDialog({ inviterId, accessToken, platform, item, locale, onClose, onSubmitted, onRefresh }: {
  inviterId: number; accessToken: string; platform: 'TIMO' | 'LINKY'; item: Item; locale: ConsumerLocale
  onClose: () => void; onSubmitted: (item: Item) => void; onRefresh: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const inFlight = useRef(false)
  const [account, setAccount] = useState('')
  const [busy, setBusy] = useState(false)
  const [outcome, setOutcome] = useState<Item | null>(null)
  const [error, setError] = useState('')
  const words = copy[locale]
  const app = platform === 'TIMO' ? 'Timo' : 'Linky'
  const length = platform === 'TIMO' ? 12 : 8
  const valid = platform === 'TIMO' ? /^[1-9][0-9]{11}$/.test(account) : /^[0-9]{8}$/.test(account)

  useEffect(() => {
    const element = dialog.current
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    element?.showModal()
    input.current?.focus()
    return () => { element?.close(); document.body.style.overflow = previousOverflow; previousFocus?.focus() }
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!valid || inFlight.current || outcome) return
    inFlight.current = true
    setBusy(true)
    setError('')
    try {
      const next = await submitInviteeBinding(inviterId, item.userId, accessToken, platform, account)
      setOutcome(next)
      onSubmitted(next)
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      setError(message.includes('inviter must verify') ? words.qualification
        : message.includes('direct invitee') ? words.relation
          : message.includes('already') ? words.existing : words.error)
      onRefresh()
    } finally { inFlight.current = false; setBusy(false) }
  }

  const resultText = outcome?.bindingStatus === 'VERIFIED' ? words.success
    : outcome?.bindingStatus === 'REJECTED' ? words.rejected : words.pending
  return <dialog ref={dialog} className="consumer-assisted-dialog" aria-labelledby="assisted-binding-title"
    onCancel={event => { event.preventDefault(); if (!inFlight.current) onClose() }}>
    <h2 id="assisted-binding-title">{words.title} · {app}</h2>
    <p>{words.user} <strong>#{item.userId}</strong></p>
    <p>{words.phone} <strong>{item.maskedPhone || '—'}</strong></p>
    {outcome ? <div className="consumer-assisted-result" role="status"><p>{resultText}</p><strong>{outcome.maskedAccount}</strong></div>
      : <form onSubmit={event => void submit(event)}>
        <p className="consumer-assisted-hint">{words.hint}</p>
        <label>{words.account} {app} ID
          <input ref={input} value={account} onChange={event => setAccount(event.target.value.replace(/\D/g, '').slice(0, length))}
            inputMode="numeric" autoComplete="off" maxLength={length} disabled={busy} required
            pattern={platform === 'TIMO' ? '[1-9][0-9]{11}' : '[0-9]{8}'} aria-describedby="assisted-binding-digits" />
        </label>
        <small id="assisted-binding-digits">{words.digits} ({length})</small>
        {error ? <p role="alert">{error}</p> : null}
        <button className="consumer-form-submit" disabled={!valid || busy} type="submit">{busy ? words.busy : words.submit}</button>
      </form>}
    <button className="consumer-assisted-close" type="button" disabled={busy} onClick={onClose}>{words.close}</button>
  </dialog>
}
