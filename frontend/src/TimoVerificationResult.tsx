import type { PlatformBindingResponse } from './api'
import type { ConsumerLocale } from './shared/catalog'
import { validSupportUrl } from './consumerSupport'

const copy: Record<ConsumerLocale, {
  waiting: string; technical: string; manual: string; rejected: string; submitted: string; reason: string; next: string
  missing: string; check: string; later: string; assist: string; retry: string; busy: string; help: string; correction: string
  safe: string; contact: string
}> = {
  zh: { waiting: '正在等待最新记录', technical: '暂时无法完成核验', manual: '需要人工协助', rejected: '暂未通过核验', submitted: '已提交，尚未形成核验结果', reason: '原因', next: '下一步', missing: '当前可用公会记录中尚未查到该 ID，这不表示账号不存在或永久不符合条件。', check: '请核对是否复制了本人 Timo ID，并确认已加入适用公会。确认信息更新后，可再次核验。', later: '尚未形成账号资格结论。请稍后查看结果；如果持续未完成，请联系运营人员协助核实。', assist: '请联系运营人员协助核实。需要人工协助并不表示已有人员受理。', retry: '再次核验', busy: '正在核验…', help: 'ID 填错了／需要帮助', correction: '当前页面不能修改已提交的 ID。请联系协助你注册的运营人员，提供 BANDEIRA 用户 ID、本人 Timo ID 和问题说明。任何更正都需要先核实本人身份及账号归属。', safe: '请勿提供密码或短信验证码。', contact: '联系官方支持' },
  en: { waiting: 'Waiting for the latest record', technical: 'Verification is temporarily unavailable', manual: 'Help from support is needed', rejected: 'Not verified yet', submitted: 'Submitted; no verification decision yet', reason: 'Reason', next: 'Next step', missing: 'This ID was not found in the currently available guild record. This does not mean the account does not exist or is permanently ineligible.', check: 'Check that you copied your own Timo ID and joined an eligible guild. You can verify again after the information is updated.', later: 'No eligibility decision has been made. Check back later; if verification remains incomplete, contact your operations representative.', assist: 'Contact your operations representative for help. A request for manual help does not mean someone has accepted the case.', retry: 'Verify again', busy: 'Verifying…', help: 'Wrong ID / need help', correction: 'This page cannot change a submitted ID. Contact the operations representative who helped you register with your BANDEIRA user ID, your own Timo ID and a description of the issue. Identity and account ownership must be checked before any correction.', safe: 'Do not share passwords or SMS verification codes.', contact: 'Contact official support' },
  es: { waiting: 'Esperando el registro más reciente', technical: 'No se pudo completar la verificación', manual: 'Se necesita asistencia', rejected: 'Aún no verificado', submitted: 'Enviado; aún no hay resultado', reason: 'Motivo', next: 'Siguiente paso', missing: 'El ID no aparece en el registro de gremio disponible. Esto no significa que la cuenta no exista o que sea permanentemente inválida.', check: 'Comprueba que copiaste tu propio ID Timo y que perteneces a un gremio válido. Puedes verificar de nuevo cuando se actualice la información.', later: 'Aún no hay una decisión sobre los requisitos. Consulta más tarde; si continúa pendiente, contacta a tu representante de operaciones.', assist: 'Contacta a tu representante de operaciones. Necesitar ayuda manual no significa que alguien ya haya aceptado el caso.', retry: 'Verificar de nuevo', busy: 'Verificando…', help: 'ID incorrecto / necesito ayuda', correction: 'Esta página no permite cambiar un ID enviado. Contacta a quien te ayudó a registrarte y proporciona tu ID de usuario BANDEIRA, tu propio ID Timo y una descripción del problema. Cualquier corrección requiere verificar tu identidad y la titularidad.', safe: 'No compartas contraseñas ni códigos SMS.', contact: 'Contactar soporte oficial' },
  id: { waiting: 'Menunggu data terbaru', technical: 'Verifikasi belum dapat diselesaikan', manual: 'Perlu bantuan petugas', rejected: 'Belum lolos verifikasi', submitted: 'Terkirim; belum ada hasil verifikasi', reason: 'Alasan', next: 'Langkah berikutnya', missing: 'ID ini belum ditemukan dalam data guild yang tersedia saat ini. Ini tidak berarti akun tidak ada atau selamanya tidak memenuhi syarat.', check: 'Pastikan Anda menyalin ID Timo milik sendiri dan telah bergabung dengan guild yang sesuai. Verifikasi dapat dicoba lagi setelah informasinya diperbarui.', later: 'Belum ada keputusan tentang kelayakan akun. Periksa hasilnya nanti; jika tetap belum selesai, hubungi petugas operasional.', assist: 'Hubungi petugas operasional untuk bantuan. Perlu bantuan manual bukan berarti permintaan sudah diterima petugas.', retry: 'Verifikasi lagi', busy: 'Memverifikasi…', help: 'ID salah / perlu bantuan', correction: 'Halaman ini tidak dapat mengubah ID yang sudah dikirim. Hubungi petugas yang membantu pendaftaran Anda dengan ID pengguna BANDEIRA, ID Timo milik sendiri, dan penjelasan masalah. Identitas dan kepemilikan akun harus diperiksa sebelum koreksi.', safe: 'Jangan berikan kata sandi atau kode verifikasi SMS.', contact: 'Hubungi dukungan resmi' },
  pt: { waiting: 'Aguardando dados atualizados', technical: 'Não foi possível concluir a verificação', manual: 'É necessária assistência', rejected: 'Ainda não verificado', submitted: 'Enviado; ainda sem resultado', reason: 'Motivo', next: 'Próximo passo', missing: 'Este ID não foi encontrado no registro de guilda disponível. Isso não significa que a conta não exista ou que seja permanentemente inelegível.', check: 'Confira se copiou seu próprio ID Timo e se entrou em uma guilda elegível. Você pode verificar novamente após a atualização das informações.', later: 'Ainda não há uma decisão sobre a elegibilidade. Confira o resultado mais tarde; se continuar pendente, contate seu responsável de operações.', assist: 'Contate seu responsável de operações. Precisar de ajuda manual não significa que alguém já aceitou o caso.', retry: 'Verificar novamente', busy: 'Verificando…', help: 'ID incorreto / preciso de ajuda', correction: 'Esta página não permite alterar um ID enviado. Contate quem ajudou no seu cadastro e informe seu ID de usuário BANDEIRA, seu próprio ID Timo e uma descrição do problema. Toda correção exige verificar a identidade e a titularidade da conta.', safe: 'Não compartilhe senhas nem códigos SMS.', contact: 'Contatar suporte oficial' },
}

export default function TimoVerificationResult({ binding, locale, loading, onRetry, localizedReason, supportUrl }: {
  binding: PlatformBindingResponse; locale: ConsumerLocale; loading: boolean; onRetry: () => void
  localizedReason: string; supportUrl?: string
}) {
  const words = copy[locale]
  const state = binding.verificationState
  const technical = state === 'ERROR'
  const manual = state === 'MANUAL_REVIEW_REQUIRED'
  const missing = binding.status === 'REJECTED' && binding.rejectionCode === 'NOT_IN_TARGET_GUILD' && !technical
  const title = manual ? words.manual : technical ? words.technical : state === 'SOURCE_STALE' ? words.waiting
    : binding.status === 'REJECTED' ? words.rejected : words.submitted
  const reason = manual ? words.submitted : technical ? localizedReason || words.technical : state === 'SOURCE_STALE' ? words.waiting
    : missing ? words.missing : localizedReason
  const support = validSupportUrl(supportUrl)
  return <section className="consumer-verification-result" aria-label={title}>
    <h3 role="status">{title}</h3>
    <p className="consumer-verification-id"><span>Timo ID</span><strong>{binding.platformUserId}</strong></p>
    {reason ? <div><h4>{words.reason}</h4><p>{reason}</p></div> : null}
    <div><h4>{words.next}</h4><p>{manual ? words.assist : technical || state === 'SOURCE_STALE' ? words.later : words.check}</p></div>
    {binding.status === 'REJECTED' ? <button className="consumer-form-submit" type="button" disabled={loading} onClick={onRetry}>{loading ? words.busy : words.retry}</button> : null}
    <details className="consumer-verification-help"><summary>{words.help}</summary><p>{words.correction}</p><p>{words.safe}</p>
      {support ? <a className="consumer-primary-link" href={support} target="_blank" rel="noopener noreferrer">{words.contact}</a> : null}
    </details>
  </section>
}
