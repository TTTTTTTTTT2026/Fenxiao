// Mirrors the legacy page gate; server-side AdminPermission remains authoritative.
export function canManageTeamsInAdmin(role?: string | null): boolean {
  return ['super_admin', 'admin', 'operations'].includes(role?.toLowerCase() ?? '')
}
