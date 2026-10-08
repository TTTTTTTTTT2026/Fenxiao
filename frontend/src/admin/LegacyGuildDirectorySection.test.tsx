import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { PlatformGuildDirectoryItem, PlatformGuildDirectorySyncRun } from '../api'
import LegacyGuildDirectorySection from './LegacyGuildDirectorySection'

const directory: PlatformGuildDirectoryItem[] = [{
  platformCode: 'LINKY', guildId: 'G100', guildName: '测试公会', guildStatus: 'ACTIVE', country: 'ID',
  directoryStatus: 'MISSING_ON_MCN', mcnRecordUpdatedAt: null, officialUpdatedAt: null,
  lastSeenAt: '2026-10-08T10:00:00+08:00', sourceVersion: null, joinInstruction: null,
  missingSince: null, operatingShareRate: 0.25,
}]
const runs: PlatformGuildDirectorySyncRun[] = [{
  runId: 'R1', platformCode: 'LINKY', syncStatus: 'SUCCESS', snapshotComplete: true,
  receivedCount: 1, upsertedCount: 1, missingCount: 1, sourceVersion: null,
  startedAt: '2026-10-08T10:00:00+08:00', completedAt: '2026-10-08T10:01:00+08:00',
  errorCode: null, errorMessage: null,
}]

describe('legacy guild directory page split', () => {
  const callbacks = { onRefresh: vi.fn(), onSelectPlatform: vi.fn() }

  it('keeps the old read-only directory fields, platform tabs and anchor', () => {
    const markup = renderToStaticMarkup(<LegacyGuildDirectorySection platform="LINKY" directory={directory} syncRuns={runs} loading={false} {...callbacks} />)

    expect(markup).toContain('id="admin-platform-guild-directory"')
    expect(markup).toContain('aria-label="平台公会目录平台选择"')
    expect(markup).toContain('aria-selected="true">LINKY')
    expect(markup).toContain('测试公会')
    expect(markup).toContain('G100')
    expect(markup).toContain('25.00%')
    expect(markup).toContain('MCN 已缺失')
    expect(markup).toContain('1 / 1 / 1')
  })

  it('keeps the old initial and loading empty states', () => {
    const initial = renderToStaticMarkup(<LegacyGuildDirectorySection platform="TIMO" directory={null} syncRuns={null} loading={false} {...callbacks} />)
    const loading = renderToStaticMarkup(<LegacyGuildDirectorySection platform="TIMO" directory={null} syncRuns={null} loading {...callbacks} />)

    expect(initial).toContain('尚未加载公会目录')
    expect(initial).toContain('当前平台还没有同步的公会。请检查最近同步批次。')
    expect(loading).toContain('刷新中…')
    expect(loading).toContain('正在读取 MCN 同步目录…')
  })
})
