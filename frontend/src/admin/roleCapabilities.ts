// Mirrors the legacy page gate; server-side AdminPermission remains authoritative.
export function canManageTeamsInAdmin(role?: string | null): boolean {
  return ['super_admin', 'admin', 'operations'].includes(role?.toLowerCase() ?? '')
}

// Mirrors AdminPermission.FINANCE and the existing legacy page gate.
export function canReadCommissionPoliciesInAdmin(role?: string | null): boolean {
  return ['super_admin', 'finance'].includes(role?.toLowerCase() ?? '')
}
