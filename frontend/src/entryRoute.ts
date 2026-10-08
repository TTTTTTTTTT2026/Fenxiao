export function isNewAdminConsoleRoute(pathname: string, hostname: string): boolean {
  const isConsolePath = pathname === '/console' || pathname.startsWith('/console/')
  return isConsolePath
    && hostname !== 'app.bandeira.fandodo.online'
    && hostname !== 'partner.bandeira.fandodo.online'
}
