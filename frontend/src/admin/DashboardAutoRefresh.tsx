export default function DashboardAutoRefresh({ checked, onChange }: {
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return <button type="button" role="switch" aria-checked={checked} aria-label="60秒自动刷新"
    className="opsdash-auto-toggle" onClick={() => onChange(!checked)}>
    <span className="opsdash-switch-track" aria-hidden="true"><span /></span>
    <span>60秒自动刷新</span>
  </button>
}
