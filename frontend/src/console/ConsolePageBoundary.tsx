import { Component, type ReactNode } from 'react'
import { Button, Result } from 'antd'

type Props = { children: ReactNode }
type State = { failed: boolean }

// Keep the workbench navigation and logout available when one lazy page fails.
// The parent keys this boundary by route so a different page starts cleanly.
export default class ConsolePageBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children

    return <div role="alert">
      <Result
        status="error"
        title="此页面暂时无法显示"
        subTitle="页面加载失败或运行异常。可尝试重新加载，或从导航切换到其他页面。"
        extra={[
          <Button key="reload" type="primary" onClick={() => window.location.reload()}>重新加载页面</Button>,
          <Button key="legacy" href="/admin">返回旧版后台</Button>,
        ]}
      />
    </div>
  }
}
