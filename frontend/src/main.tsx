import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { isNewAdminConsoleRoute } from './entryRoute'

const entry = isNewAdminConsoleRoute(window.location.pathname, window.location.hostname)
  ? import('./console/ConsoleApp').then(({ default: App }) => App)
  : import('./legacyEntry').then(({ default: App }) => App)

void entry.then((App) => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
