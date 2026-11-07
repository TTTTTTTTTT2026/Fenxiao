import { useState } from 'react'
import { ArrowUp, CaretRight, CheckCircle, DeviceMobile, DownloadSimple, IdentificationCard, LinkSimple } from '@phosphor-icons/react'
import { timoInvitationArtworkUrl } from './timoInvitationArtwork'
import { bindingGuideCopy } from './consumerBindingGuideCopy'
import './consumerBindingGuide.css'

type Locale = keyof typeof bindingGuideCopy
type AppName = 'Timo' | 'Linky'

const downloadUrls = {
  Timo: 'https://web.timo.club/i/index.html#/5?lg=id_ID&code=SJ44R5&source=1',
  Linky: 'https://play.google.com/store/apps/details?id=com.real.unshow.linky',
}

type GuideProps = { app: AppName; locale: Locale } & (
  | { onFocusForm: () => void; showStatus?: boolean; verificationMessage?: never }
  | { onFocusForm?: never; showStatus?: never; verificationMessage?: string }
)

export function TimoEarningsHero({ locale }: { locale: Locale }) {
  const [imageState, setImageState] = useState<'loading' | 'ready' | 'missing'>('loading')
  const copy = bindingGuideCopy[locale]
  return <section className={imageState === 'ready' ? 'binding-guide-artwork' : 'binding-guide-hero'}>
    {imageState !== 'missing' ? <img src={timoInvitationArtworkUrl(locale)} alt="" hidden={imageState !== 'ready'}
      onLoad={() => setImageState('ready')} onError={() => setImageState('missing')} /> : null}
    <h1 className={imageState === 'ready' ? 'consumer-visually-hidden' : undefined}>
      <span className="binding-guide-invite-label">{copy.invitationArtwork}</span>
      {copy.neutralTitle}
    </h1>
  </section>
}

export default function ConsumerBindingGuide({ app, locale, onFocusForm, showStatus, verificationMessage }: GuideProps) {
  const copy = bindingGuideCopy[locale]
  const DownloadIcon = onFocusForm ? DeviceMobile : DownloadSimple
  const AccountIcon = onFocusForm ? IdentificationCard : LinkSimple
  const steps = [
    { text: copy.step1(app), Icon: DownloadIcon },
    { text: copy.step2(app), Icon: IdentificationCard },
    { text: copy.step3, Icon: CheckCircle },
  ]

  return <div className={`binding-guide${onFocusForm ? '' : ' binding-guide--earnings'}`}>
    <section className="binding-guide-card binding-guide-action">
      <span className="binding-guide-icon"><DownloadIcon weight="bold" aria-hidden="true" /></span>
      <div>
        <h2>{copy.noAccount(app)}</h2>
        <p>{copy.downloadHint}</p>
      </div>
      <a className="binding-guide-cta" href={downloadUrls[app]} target="_blank" rel="noopener noreferrer">
        {copy.download(app)}{onFocusForm ? null : <CaretRight weight="bold" aria-hidden="true" />}
      </a>
    </section>

    <section className="binding-guide-card binding-guide-action">
      <span className="binding-guide-icon"><AccountIcon weight="bold" aria-hidden="true" /></span>
      <div>
        <h2>{copy.hasAccount(app)}</h2>
        {showStatus ? null : <p>{onFocusForm ? copy.existingHint(app) : verificationMessage || copy.earningsExistingHint}</p>}
      </div>
      {onFocusForm
        ? <button className="binding-guide-cta" type="button" onClick={onFocusForm}>
            {showStatus ? copy.viewStatus : copy.scrollTop}<ArrowUp weight="bold" aria-hidden="true" />
          </button>
        : <a className="binding-guide-cta" href="/account/timo">
            {verificationMessage ? copy.viewStatus : copy.goBind}<CaretRight weight="bold" aria-hidden="true" />
          </a>}
    </section>

    <section className="binding-guide-card binding-guide-tutorial">
      <h2>{copy.tutorialTitle}</h2>
      <ol role="list">
        {steps.map(({ text, Icon }, index) => <li key={text}>
          <span className="binding-guide-number" aria-hidden="true">{index + 1}</span>
          <span className="binding-guide-icon"><Icon weight="bold" aria-hidden="true" /></span>
          <span>{text}</span>
        </li>)}
      </ol>
    </section>
  </div>
}
