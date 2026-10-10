import { ArrowRight, LinkSimple } from '@phosphor-icons/react'

type ConsumerLocale = 'zh' | 'en' | 'es' | 'id' | 'pt'

const guidanceCopy: Record<ConsumerLocale, { title: string; detail: string; bind: string; timo: string; linky: string; close: string; errorTitle: string; errorDetail: string }> = {
  zh: { title: '尚未完成应用绑定', detail: '请先绑定 Timo 或 Linky 账号并通过核验。完成后即可解锁对应应用的收益等功能。', bind: '去绑定应用', timo: '绑定 Timo', linky: '绑定 Linky', close: '知道了', errorTitle: '暂时无法确认绑定状态', errorDetail: '请稍后重试，或前往【我】查看应用绑定情况。' },
  en: { title: 'No verified app account yet', detail: 'Link your Timo or Linky account and complete verification to unlock earnings and other features for that app.', bind: 'Link an app', timo: 'Link Timo', linky: 'Link Linky', close: 'Got it', errorTitle: 'Could not check your app status', errorDetail: 'Please try again later or check your app bindings in Account.' },
  es: { title: 'Aún no tienes una cuenta de aplicación verificada', detail: 'Vincula tu cuenta de Timo o Linky y completa la verificación para acceder a las ganancias y otras funciones de esa aplicación.', bind: 'Vincular aplicación', timo: 'Vincular Timo', linky: 'Vincular Linky', close: 'Entendido', errorTitle: 'No pudimos comprobar el estado de vinculación', errorDetail: 'Inténtalo más tarde o revisa tus cuentas vinculadas en Cuenta.' },
  id: { title: 'Belum ada akun aplikasi yang terverifikasi', detail: 'Hubungkan akun Timo atau Linky dan selesaikan verifikasi untuk membuka penghasilan serta fitur lain pada aplikasi tersebut.', bind: 'Hubungkan aplikasi', timo: 'Hubungkan Timo', linky: 'Hubungkan Linky', close: 'Mengerti', errorTitle: 'Status akun belum dapat diperiksa', errorDetail: 'Coba lagi nanti atau periksa akun yang terhubung di halaman Akun.' },
  pt: { title: 'Nenhuma conta de aplicativo verificada', detail: 'Vincule sua conta Timo ou Linky e conclua a verificação para liberar os ganhos e outros recursos desse aplicativo.', bind: 'Vincular aplicativo', timo: 'Vincular Timo', linky: 'Vincular Linky', close: 'Entendi', errorTitle: 'Não foi possível verificar o vínculo', errorDetail: 'Tente novamente mais tarde ou confira as contas vinculadas na página Conta.' },
}

export function ConsumerUnboundGuidance({ locale, variant = 'notice', bindHref = '/account' }: { locale: ConsumerLocale; variant?: 'notice' | 'gate'; bindHref?: string }) {
  const copy = guidanceCopy[locale]
  if (variant === 'gate') {
    return <section className="consumer-auth-gate consumer-unbound-gate" role="status">
      <div className="consumer-auth-icon"><LinkSimple weight="duotone" aria-hidden="true" /></div>
      <h1>{copy.title}</h1>
      <p>{copy.detail}</p>
      <div className="consumer-unbound-actions">
        <a className="consumer-primary-link" href="/account/timo">{copy.timo}<ArrowRight weight="bold" aria-hidden="true" /></a>
        <a className="consumer-secondary-link" href="/account/linky">{copy.linky}<ArrowRight weight="bold" aria-hidden="true" /></a>
      </div>
    </section>
  }
  return <section className="consumer-unbound-notice" role="status">
    <div><strong>{copy.title}</strong><p>{copy.detail}</p></div>
    <a href={bindHref}>{copy.bind}<ArrowRight weight="bold" aria-hidden="true" /></a>
  </section>
}

export function ConsumerUnboundDialog({ locale, error = false, onClose }: { locale: ConsumerLocale; error?: boolean; onClose: () => void }) {
  const copy = guidanceCopy[locale]
  const bindingNotice: Record<ConsumerLocale, string> = {
    zh: '需要完成任意平台的绑定并通过核验，才可以继续获得对应应用的额外收入。',
    en: 'Bind and verify an app account before earning additional income from that app.',
    es: 'Vincula y verifica una cuenta de aplicación para obtener ingresos adicionales de esa aplicación.',
    id: 'Hubungkan dan verifikasi akun aplikasi agar dapat memperoleh penghasilan tambahan dari aplikasi tersebut.',
    pt: 'Vincule e valide uma conta de aplicativo para obter ganhos adicionais desse aplicativo.',
  }
  return <div className="consumer-modal-backdrop" onClick={onClose}>
    <section className="consumer-unbound-dialog" role="dialog" aria-modal="true" aria-label={error ? copy.errorTitle : copy.title} onClick={(event) => event.stopPropagation()}>
      {error ? <><h2>{copy.errorTitle}</h2><p>{copy.errorDetail}</p><a className="consumer-primary-link" href="/account">{copy.bind}<ArrowRight weight="bold" aria-hidden="true" /></a></>
        : <><p className="consumer-binding-priority">{bindingNotice[locale]}</p><ConsumerUnboundGuidance locale={locale} variant="gate" /></>}
      <button type="button" className="consumer-unbound-dialog-close" onClick={onClose} autoFocus>{copy.close}</button>
    </section>
  </div>
}
