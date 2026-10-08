import { useMemo, useState } from 'react'
import { Alert, Button, Card, Input, Result, Select, Typography } from 'antd'
import type { AdminSessionResponse } from '../api'
import { buildChannelEntryLinks, consumerEntryOrigin, CONSUMER_ORIGIN } from '../publicEntries'
import { channelProductsForScope } from './channelProducts'

const { Paragraph, Text, Title } = Typography

export default function ChannelEntriesPage({ session }: { session: AdminSessionResponse }) {
  const products = channelProductsForScope(session.platformScope)
  const [product, setProduct] = useState(() => products[0] ?? '')
  const [origin, setOrigin] = useState(() => typeof window !== 'undefined' ? consumerEntryOrigin(window.location.origin) : CONSUMER_ORIGIN)
  const [country, setCountry] = useState('ID')
  const [language, setLanguage] = useState('id')
  const [channel, setChannel] = useState('whatsapp-main')
  const [inviteCode, setInviteCode] = useState('')
  const [copyError, setCopyError] = useState('')
  const [copied, setCopied] = useState('')

  const links = useMemo(() => buildChannelEntryLinks(origin, { product, country, language, channel, inviteCode }), [origin, product, country, language, channel, inviteCode])

  if (!products.includes(product)) return <Result status="403" title="当前账号没有可使用的产品范围" />

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(url)
      setCopyError('')
    } catch {
      setCopyError('复制链接失败，请手动复制。')
      setCopied('')
    }
  }

  return <>
    <Title level={3}>渠道入口</Title>
    <Text type="secondary">沿用旧版后台的链接生成规则，仅在浏览器内组合追踪参数，不写入服务端。</Text>
    <div className="new-console-directory-actions"><Button href="/admin#admin-channel-entries">打开旧版渠道入口</Button></div>
    <Card title="入口生成条件" className="new-console-channel-card">
      <div className="new-console-channel-fields">
        <label>产品
          <Select aria-label="渠道产品" value={product} options={products.map((value) => ({ value, label: value === 'ALL' ? '全部产品' : value }))} onChange={setProduct} />
        </label>
        <label>入口域名
          <Input aria-label="入口域名" value={origin} onChange={(event) => setOrigin(event.target.value)} placeholder={CONSUMER_ORIGIN} readOnly={typeof window !== 'undefined' && window.location.hostname === 'bandeira.fandodo.online'} />
        </label>
        <label>国家
          <Input aria-label="国家" value={country} onChange={(event) => setCountry(event.target.value)} placeholder="ID / MX / BR" />
        </label>
        <label>语言
          <Input aria-label="语言" value={language} onChange={(event) => setLanguage(event.target.value)} placeholder="id / es / pt" />
        </label>
        <label>渠道标识
          <Input aria-label="渠道标识" value={channel} onChange={(event) => setChannel(event.target.value)} placeholder="whatsapp-main / meta-id-01" />
        </label>
        <label>邀请码
          <Input aria-label="邀请码" value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} placeholder="ABCD1234" />
        </label>
      </div>
    </Card>
    <Card title="追踪链接" className="new-console-channel-card">
      {copyError ? <Alert type="error" showIcon message={copyError} className="new-console-alert" /> : null}
      {copied ? <Alert type="success" showIcon message="链接已复制" className="new-console-alert" /> : null}
      <div className="new-console-channel-links">
        {links.map((item) => <div key={item.key} className="new-console-channel-link">
          <Text strong>{item.label}</Text>
          <Paragraph copyable={false} className="new-console-channel-url">{item.url}</Paragraph>
          <Button href={item.url} target="_blank" rel="noopener noreferrer">打开页面</Button>
          <Button onClick={() => { void copyLink(item.url) }}>复制渠道链接</Button>
        </div>)}
      </div>
    </Card>
  </>
}
