import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DataTable, EmptyState, InfoRow, PanelSection, StatusBadge } from './LegacyPresentation'

describe('legacy admin presentation contract', () => {
  it('keeps the existing panel structure and anchor used by old hash navigation', () => {
    const markup = renderToStaticMarkup(<PanelSection
      sectionId="admin-platform-guild-directory"
      eyebrow="MCN authoritative directory"
      title="平台公会目录"
      description="只读目录"
      action={<button>刷新目录</button>}
    ><span>页面内容</span></PanelSection>)

    expect(markup).toContain('class="panel-card" id="admin-platform-guild-directory"')
    expect(markup).toContain('class="panel-action"')
    expect(markup).toContain('刷新目录')
    expect(markup).toContain('页面内容')
  })

  it('preserves table empty and populated structures', () => {
    const empty = renderToStaticMarkup(<DataTable headers={['用户', '状态']} emptyText="暂无用户" />)
    const populated = renderToStaticMarkup(<DataTable headers={['用户', '状态']} rows={[[<strong key="name">测试用户</strong>, '正常']]} rowClassNames={['highlight']} emptyText="暂无用户" />)

    expect(empty).toContain('<td colSpan="2">暂无用户</td>')
    expect(populated).toContain('class="highlight"')
    expect(populated).toContain('<strong>测试用户</strong>')
    expect(populated).not.toContain('暂无用户')
  })

  it('keeps status, empty-state and detail-row labels', () => {
    expect(renderToStaticMarkup(<StatusBadge status="MISSING_ON_MCN" />)).toContain('class="badge badge-danger">MCN 已缺失')
    expect(renderToStaticMarkup(<EmptyState title="尚未设置" description="请配置" />)).toContain('class="empty-state-label">未设置')
    expect(renderToStaticMarkup(<InfoRow label="用户 ID" value="123" code />)).toContain('<code>123</code>')
  })
})
