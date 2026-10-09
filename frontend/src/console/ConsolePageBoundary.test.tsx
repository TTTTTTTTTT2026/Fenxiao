import { isValidElement, type ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ConsolePageBoundary from './ConsolePageBoundary'

describe('console page failure recovery', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('leaves a healthy page untouched', () => {
    const content = <section>正常页面</section>
    const boundary = new ConsolePageBoundary({ children: content })
    expect(boundary.render()).toBe(content)
  })

  it('replaces a failed page with a readable alert and a legacy escape route', () => {
    const boundary = new ConsolePageBoundary({ children: <section>原页面数据</section> })
    boundary.state = ConsolePageBoundary.getDerivedStateFromError()
    const markup = renderToStaticMarkup(boundary.render())
    expect(markup).toContain('role="alert"')
    expect(markup).toContain('此页面暂时无法显示')
    expect(markup).toContain('重新加载页面')
    expect(markup).toContain('href="/admin"')
    expect(markup).not.toContain('原页面数据')
  })

  it('reloads only on explicit click, allowing failed lazy imports to be fetched again', () => {
    const reload = vi.fn()
    vi.stubGlobal('window', { location: { reload } })
    const boundary = new ConsolePageBoundary({ children: null })
    boundary.state = ConsolePageBoundary.getDerivedStateFromError()
    const wrapper = boundary.render() as ReactElement<{ children: ReactElement<{ extra: ReactElement<{ onClick?: () => void }>[] }> }>
    const buttons = wrapper.props.children.props.extra
    expect(reload).not.toHaveBeenCalled()
    const button = buttons.find((element) => isValidElement(element) && element.key === 'reload')!
    button.props.onClick!()
    expect(reload).toHaveBeenCalledOnce()
    expect(new ConsolePageBoundary({ children: 'another page' }).render()).toBe('another page')
  })
})
