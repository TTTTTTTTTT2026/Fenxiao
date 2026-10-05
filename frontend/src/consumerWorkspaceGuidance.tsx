import { ArrowRight, LinkSimple } from '@phosphor-icons/react'

type ConsumerLocale = 'zh' | 'en' | 'es' | 'id' | 'pt'

const guidanceCopy: Record<ConsumerLocale, { title: string; detail: string; bind: string; timo: string; linky: string }> = {
  zh: { title: '尚未完成应用绑定', detail: '请先绑定 Timo 或 Linky 账号并通过核验。完成后即可解锁对应应用的收益等功能。', bind: '去绑定应用', timo: '绑定 Timo', linky: '绑定 Linky' },
  en: { title: 'No verified app account yet', detail: 'Link your Timo or Linky account and complete verification to unlock earnings and other features for that app.', bind: 'Link an app', timo: 'Link Timo', linky: 'Link Linky' },
  es: { title: 'Aún no tienes una cuenta de aplicación verificada', detail: 'Vincula tu cuenta de Timo o Linky y completa la verificación para acceder a las ganancias y otras funciones de esa aplicación.', bind: 'Vincular aplicación', timo: 'Vincular Timo', linky: 'Vincular Linky' },
  id: { title: 'Belum ada akun aplikasi yang terverifikasi', detail: 'Hubungkan akun Timo atau Linky dan selesaikan verifikasi untuk membuka penghasilan serta fitur lain pada aplikasi tersebut.', bind: 'Hubungkan aplikasi', timo: 'Hubungkan Timo', linky: 'Hubungkan Linky' },
  pt: { title: 'Nenhuma conta de aplicativo verificada', detail: 'Vincule sua conta Timo ou Linky e conclua a verificação para liberar os ganhos e outros recursos desse aplicativo.', bind: 'Vincular aplicativo', timo: 'Vincular Timo', linky: 'Vincular Linky' },
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
