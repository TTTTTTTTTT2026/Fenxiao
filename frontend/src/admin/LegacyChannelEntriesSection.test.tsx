import { isValidElement, type ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { buildChannelEntryLinks, CONSUMER_ORIGIN } from '../publicEntries'
import LegacyChannelEntriesSection, { type ChannelEntryForm } from './LegacyChannelEntriesSection'

const form: ChannelEntryForm = { origin: CONSUMER_ORIGIN, country: 'ID', language: 'id', channel: 'whatsapp-main', inviteCode: 'ABCD1234' }
const links = buildChannelEntryLinks(form.origin, { product: 'LINKY', ...form })

function findElement(node: unknown, matches: (element: ReactElement<Record<string, unknown>>) => boolean): ReactElement<Record<string, unknown>> | undefined {
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findElement(item, matches)
      if (found) return found
    }
  } else if (isValidElement<Record<string, unknown>>(node)) {
    if (matches(node)) return node
    for (const value of Object.values(node.props)) {
      if (typeof value === 'function') continue
      const found = findElement(value, matches)
      if (found) return found
    }
  }
  return undefined
}

describe('legacy channel entry page split', () => {
  it('keeps the old anchor, form values, tracking summary and three generated links', () => {
    const markup = renderToStaticMarkup(<LegacyChannelEntriesSection form={form} productLabel="Linky" links={links} onFormChange={vi.fn()} onOpen={vi.fn()} onCopy={vi.fn()} />)
    expect(markup).toContain('id="admin-invite-ops"')
    expect(markup).toContain('入口生成条件')
    expect(markup).toContain('value="whatsapp-main"')
    expect(markup).toContain('Linky')
    expect(markup).toContain('邀请注册入口')
    expect(markup).toContain('Linky 绑定入口')
    expect(markup).toContain('收益查看入口')
    expect(markup).toContain('inviteCode=ABCD1234')
  })

  it('preserves edits and the selected-link actions', () => {
    const onFormChange = vi.fn()
    const onOpen = vi.fn()
    const onCopy = vi.fn()
    const tree = LegacyChannelEntriesSection({ form, productLabel: 'Linky', links, onFormChange, onOpen, onCopy })
    const channelInput = findElement(tree, (element) => element.type === 'input' && element.props.placeholder === 'whatsapp-main / meta-id-01')
    const openButton = findElement(tree, (element) => element.type === 'button' && element.props.children === '打开页面')
    const copyButton = findElement(tree, (element) => element.type === 'button' && element.props.children === '复制渠道链接')

    expect(channelInput).toBeDefined()
    expect(openButton).toBeDefined()
    expect(copyButton).toBeDefined()
    ;(channelInput!.props.onChange as (event: { target: { value: string } }) => void)({ target: { value: 'meta-id-01' } })
    ;(openButton!.props.onClick as () => void)()
    ;(copyButton!.props.onClick as () => void)()
    expect(onFormChange).toHaveBeenCalledWith({ ...form, channel: 'meta-id-01' })
    expect(onOpen).toHaveBeenCalledWith(links[0].url)
    expect(onCopy).toHaveBeenCalledWith(links[0].url)
  })
})
