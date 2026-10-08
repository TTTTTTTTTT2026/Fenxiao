import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { AdminSessionResponse } from '../api'
import ChannelEntriesPage from './ChannelEntriesPage'
import { channelProductsForScope } from './channelProducts'

const session: AdminSessionResponse = {
  sessionToken: 'test-session', expiresAt: '', username: 'operator', displayName: '测试管理员', role: 'operator',
  mustChangePassword: false, rememberMe: false, passwordExpiresAt: null, platformScope: 'LINKY', guildScope: '*', regionScope: '*',
}

describe('new console channel entries', () => {
  it('uses the existing platform scope and never offers an out-of-scope product', () => {
    expect(channelProductsForScope('*')).toEqual(['ALL', 'LINKY', 'TIMO'])
    expect(channelProductsForScope('LINKY')).toEqual(['LINKY'])
    expect(channelProductsForScope('TIMO')).toEqual(['TIMO'])
    expect(channelProductsForScope('OTHER')).toEqual([])
  })

  it('renders the same three generated links without a server write action', () => {
    const markup = renderToStaticMarkup(<ChannelEntriesPage session={session} />)
    expect(markup).toContain('渠道入口')
    expect(markup).toContain('邀请注册入口')
    expect(markup).toContain('Linky 绑定入口')
    expect(markup).toContain('收益查看入口')
    expect(markup).toContain('product=LINKY')
    expect(markup).not.toContain('product=TIMO')
    expect(markup).toContain('/admin#admin-channel-entries')
  })

  it('denies a session with no supported platform', () => {
    const markup = renderToStaticMarkup(<ChannelEntriesPage session={{ ...session, platformScope: 'OTHER' }} />)
    expect(markup).toContain('当前账号没有可使用的产品范围')
  })
})
