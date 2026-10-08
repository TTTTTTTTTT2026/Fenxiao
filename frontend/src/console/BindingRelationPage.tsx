import { useEffect, useState } from 'react'
import { Alert, Button, Card, Descriptions, Empty, Input, Result, Select, Space, Typography } from 'antd'
import type { AdminSessionResponse } from '../admin/authApi'
import { getAdminRelation, type RelationDetailResponse } from '../admin/bindingApi'
import { formatDateTime } from '../shared/dateTime'
import { allowedConsolePlatforms, availableConsoleRoutes, type ConsolePlatform } from './navigation'
import { parseAccountUserId } from './userAccountModel'

const { Text, Title } = Typography
type Query = { userId: number; platform: ConsolePlatform }

export default function BindingRelationPage({ session }: { session: AdminSessionResponse }) {
  const permitted = availableConsoleRoutes(session.role).some((route) => route.key === 'bindingRelation')
  const platforms = allowedConsolePlatforms(session.platformScope)
  const [platform, setPlatform] = useState<ConsolePlatform | null>(platforms[0] ?? null)
  const [userIdDraft, setUserIdDraft] = useState('')
  const [query, setQuery] = useState<Query | null>(null)
  const [result, setResult] = useState<RelationDetailResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!query || !permitted) return
    let active = true
    void getAdminRelation(session.sessionToken, query.userId, query.platform)
      .then((data) => { if (active) { setResult(data); setError('') } })
      .catch((reason: unknown) => { if (active) { setResult(null); setError(reason instanceof Error ? reason.message : '邀请关系加载失败') } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [permitted, query, session.sessionToken])

  if (!permitted) return <Result status="403" title="当前账号无权查看邀请关系" />
  if (!platform) return <Result status="403" title="当前账号没有可查看的产品范围" />

  function search() {
    const userId = parseAccountUserId(userIdDraft)
    if (userId === null) {
      setResult(null)
      setError('请输入有效的正整数用户 ID')
      return
    }
    setError('')
    setResult(null)
    setLoading(true)
    setQuery({ userId, platform: platform! })
  }

  return <>
    <Title level={3}>邀请关系查询 · 只读</Title>
    <Text type="secondary">按用户 ID 和当前获授权产品查看原有邀请关系；调整邀请人、修正归属等敏感操作仍在旧版后台。</Text>
    <div className="new-console-directory-actions">
      <Space wrap>
        <Select aria-label="邀请关系产品选择" value={platform} options={platforms.map((item) => ({ value: item, label: item }))} onChange={(value: ConsolePlatform) => { setPlatform(value); setQuery(null); setResult(null); setError(''); setLoading(false) }} style={{ minWidth: 130 }} />
        <Input.Search aria-label="邀请关系用户 ID" inputMode="numeric" value={userIdDraft} onChange={(event) => { setUserIdDraft(event.target.value); setQuery(null); setResult(null); setError(''); setLoading(false) }} onSearch={search} enterButton="查询关系" placeholder="输入用户 ID" loading={loading} style={{ width: 330 }} />
        <Button href="/admin#admin-bindings">打开旧版绑定管理</Button>
      </Space>
    </div>
    {error ? <Alert type="error" showIcon message={error} className="new-console-alert" /> : null}
    {result ? <Card title={`用户 #${result.userId} · ${query?.platform ?? platform} 邀请关系`}>
      <Descriptions column={{ xs: 1, sm: 2 }} items={[
        { key: 'level1', label: '直接邀请人', children: result.level1InviterId ?? '—' },
        { key: 'level2', label: '二级邀请人', children: result.level2InviterId ?? '—' },
        { key: 'level3', label: '三级邀请人（历史）', children: result.level3InviterId ?? '—' },
        { key: 'source', label: '绑定来源', children: result.bindSource || '—' },
        { key: 'status', label: '锁定状态', children: result.lockStatus || '—' },
        { key: 'country', label: '国家／地区', children: result.countryCode || '—' },
        { key: 'crossCountry', label: '跨国关系', children: result.crossCountry ? '是' : '否' },
        { key: 'boundAt', label: '绑定时间', children: formatDateTime(result.bindTime) },
        { key: 'lockedAt', label: '锁定时间', children: result.lockTime ? formatDateTime(result.lockTime) : '—' },
      ]} />
    </Card> : <Card><Empty description={loading ? '正在查询邀请关系' : '输入用户 ID 后查看当前产品的邀请关系'} /></Card>}
  </>
}
