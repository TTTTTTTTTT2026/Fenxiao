// Mirrors the legacy page gate; server-side AdminPermission remains authoritative.
export function canManageTeamsInAdmin(role?: string | null): boolean {
  return ['super_admin', 'admin', 'operations'].includes(role?.toLowerCase() ?? '')
}

// Frontend visibility only; AdminPermission.FINANCE remains authoritative on the server.
export function canReadFinanceInAdmin(role?: string | null): boolean {
  return ['super_admin', 'finance'].includes(role?.toLowerCase() ?? '')
}

export const canReadCommissionPoliciesInAdmin = canReadFinanceInAdmin
