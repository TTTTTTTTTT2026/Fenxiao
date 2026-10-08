import { useEffect, useState } from 'react'
import { Alert, Button, Card, Descriptions, Empty, Result, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { AdminSessionResponse } from '../admin/authApi'
import { getAdminPlatformIntegrations, getAdminPlatformVerificationRuntime, type PlatformIntegrationResponse, type PlatformVerificationRuntimeResponse } from '../admin/platformReadApi'
import { canReadGlobalPlatformIntegrations } from './navigation'

const { Text, Title } = Typography
type TargetGuild = PlatformIntegrationResponse['targetGuilds'][number]

function shareLabel(guild: TargetGuild) {
  const active = guild.operatingShareRate == null ? '未配置' : `${(guild.operatingShareRate * 100).toFixed(2)}%`
  if (guild.pendingOperatingShareRate == null) return active
  return `${active} · 待审批 V${guild.pendingShareVersion ?? '—'}：${(guild.pendingOperatingShareRate * 100).toFixed(2)}%`
}

const columns: ColumnsType<TargetGuild> = [
  { title: '国家', dataIndex: 'countryCode', width: 90 },
  { title: '官方公会 ID', dataIndex: 'officialGuildId', width: 170 },
  { title: '公会名称', dataIndex: 'guildName', width: 180 },
  { title: '目录 / 公会状态', key: 'status', width: 190, render: (_, guild) => `${guild.directoryStatus} / ${guild.guildStatus}` },
  { title: '当前公司比例', key: 'share', width: 240, render: (_, guild) => shareLabel(guild) },
  { title: '权威目录', dataIndex: 'authoritative', width: 120, render: (value: boolean) => <Tag color={value ? 'green' : 'default'}>{value ? '是' : '否'}</Tag> },
]

export function PlatformIntegrationSnapshot({ platform }: { platform: PlatformIntegrationResponse }) {
  return <Card title={<Space>{platform.displayName}<Tag color={platform.enabled ? 'green' : 'default'}>{platform.enabled ? '已启用' : '已停用'}</Tag></Space>} className="new-console-directory-summary">
    <Descriptions column={{ xs: 1, sm: 2 }} items={[
      { key: 'code', label: '平台代码', children: platform.platformCode },
      { key: 'identifier', label: '账号主标识', children: platform.primaryAccountIdentifier },
      { key: 'mcn', label: 'MCN 接入状态', children: platform.mcnIntegrationStatus },
      { key: 'revenue', label: '收益接入模式', children: platform.revenueIngestionMode },
      { key: 'reward', label: '奖励模式', children: platform.rewardMode },
    ]} />
    <Text type="secondary">{platform.accountIdentifierNote}</Text>
    <Table<TargetGuild> rowKey={(guild) => `${guild.countryCode}:${guild.officialGuildId}`} columns={columns} dataSource={platform.targetGuilds} pagination={{ pageSize: 20, showSizeChanger: false }} scroll={{ x: 1000 }} locale={{ emptyText: <Empty description="MCN 权威公会目录暂无数据" /> }} />
  </Card>
}

export default function PlatformIntegrationPage({ session }: { session: AdminSessionResponse }) {
  // The existing GETs return global configuration without a server-side product-scope filter.
  const permitted = canReadGlobalPlatformIntegrations(session)
  const [integrations, setIntegrations] = useState<PlatformIntegrationResponse[] | null>(null)
  const [runtime, setRuntime] = useState<PlatformVerificationRuntimeResponse | null>(null)
  const [loading, setLoading] = useState(permitted)
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    if (!permitted) return
    let active = true
    void Promise.all([getAdminPlatformIntegrations(session.sessionToken), getAdminPlatformVerificationRuntime(session.sessionToken)])
      .then(([items, status]) => { if (active) { setIntegrations(items); setRuntime(status); setError('') } })
      .catch((reason: unknown) => { if (active) { setError(reason instanceof Error ? reason.message : '平台接入配置加载失败'); setIntegrations(null); setRuntime(null) } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [permitted, refresh, session.sessionToken])

  if (!permitted) return <Result status="403" title="当前账号无权查看全局平台接入配置" />

  return <>
    <Title level={3}>平台接入配置 · 只读</Title>
    <Text type="secondary">沿用现有全局平台配置及核验通道接口，不按管理员数据范围过滤，因此本页仅向拥有全局范围的最高管理员开放。公会比例和接入状态以服务端记录为准，本页不提供修改或审批。</Text>
    <div className="new-console-directory-actions"><Space wrap><Button onClick={() => { setLoading(true); setRefresh((value) => value + 1) }} loading={loading}>刷新配置</Button><Button href="/admin#admin-system-platforms">打开旧版平台接入</Button></Space></div>
    {error ? <Alert type="error" showIcon message={error} className="new-console-alert" /> : null}
    {runtime ? <Card title="核验通道" className="new-console-directory-summary"><Descriptions column={{ xs: 1, sm: 2 }} items={[
      { key: 'source', label: '有效数据源', children: runtime.source },
      { key: 'mock', label: 'Mock 管理', children: runtime.mockManagementEnabled ? '可用（仅本地 / 测试）' : '不可用' },
    ]} /><Text type="secondary">{runtime.explanation}</Text></Card> : null}
    {integrations?.map((platform) => <PlatformIntegrationSnapshot key={platform.platformCode} platform={platform} />)}
    {loading && !integrations ? <Card loading aria-label="正在加载平台接入配置" /> : null}
    {!loading && integrations?.length === 0 ? <Empty description="尚未初始化平台配置" /> : null}
  </>
}
