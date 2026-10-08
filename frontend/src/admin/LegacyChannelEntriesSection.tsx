import type { PublicEntryLink } from '../publicEntries'
import { CONSUMER_ORIGIN } from '../publicEntries'
import { InfoCard, InfoRow, InlineHint, PanelSection } from './LegacyPresentation'

export type ChannelEntryForm = {
  origin: string
  country: string
  language: string
  channel: string
  inviteCode: string
}

type Props = {
  form: ChannelEntryForm
  productLabel: string
  links: PublicEntryLink[]
  onFormChange: (form: ChannelEntryForm) => void
  onOpen: (url: string) => void
  onCopy: (url: string) => void
}

export default function LegacyChannelEntriesSection({ form, productLabel, links, onFormChange, onOpen, onCopy }: Props) {
  return <PanelSection sectionId="admin-invite-ops" eyebrow="Channel Entry" title="渠道入口管理" description="">
    <InfoCard title="入口生成条件" tone="neutral">
      <div className="grid-form compact-form exception-filter-grid">
        <label>入口域名
          <input value={form.origin} onChange={(event) => onFormChange({ ...form, origin: event.target.value })} placeholder={CONSUMER_ORIGIN} readOnly={typeof window !== 'undefined' && window.location.hostname === 'bandeira.fandodo.online'} />
        </label>
        <label>国家
          <input value={form.country} onChange={(event) => onFormChange({ ...form, country: event.target.value })} placeholder="ID / MX / BR" />
        </label>
        <label>语言
          <input value={form.language} onChange={(event) => onFormChange({ ...form, language: event.target.value })} placeholder="id / es / pt" />
        </label>
        <label>渠道标识
          <input value={form.channel} onChange={(event) => onFormChange({ ...form, channel: event.target.value })} placeholder="whatsapp-main / meta-id-01" />
        </label>
        <label>邀请码
          <input value={form.inviteCode} onChange={(event) => onFormChange({ ...form, inviteCode: event.target.value })} placeholder="ABCD1234" />
        </label>
      </div>
      <InlineHint text="自动生成三条渠道链接。" />
    </InfoCard>
    <InfoCard title="追踪参数" tone="success">
      <div className="relation-grid top-gap">
        <div className="relation-item"><span>产品</span><strong>{productLabel}</strong></div>
        <div className="relation-item"><span>国家 / 语言</span><strong>{form.country || '-'} / {form.language || '-'}</strong></div>
        <div className="relation-item"><span>渠道</span><strong>{form.channel || '-'}</strong></div>
        <div className="relation-item"><span>邀请码</span><strong>{form.inviteCode || '-'}</strong></div>
      </div>
      {links.map((item) => <div key={item.key} className="public-entry-item">
        <InfoRow label={item.label} value={item.url} code />
        <div className="action-row top-gap public-entry-actions">
          <button className="ghost-btn small-btn" type="button" onClick={() => onOpen(item.url)}>打开页面</button>
          <button className="ghost-btn small-btn" type="button" onClick={() => onCopy(item.url)}>复制渠道链接</button>
        </div>
      </div>)}
    </InfoCard>
  </PanelSection>
}
