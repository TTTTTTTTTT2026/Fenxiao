import { buildAdminSectionLinks } from '../opsConsole'

export function canViewUserList(role: string): boolean {
  return buildAdminSectionLinks(role).some((section) => section.href === '#admin-users')
}

export function userListFilters(params: { userId?: string; current?: number; pageSize?: number }) {
  const userId = params.userId?.trim() ?? ''
  if (userId && !/^\d+$/.test(userId)) throw new Error('用户 ID 只能输入数字')
  const parsedUserId = userId ? Number(userId) : undefined
  if (parsedUserId !== undefined && !Number.isSafeInteger(parsedUserId)) throw new Error('用户 ID 超出有效范围')

  const current = Number.isSafeInteger(params.current) && (params.current ?? 0) > 0 ? params.current! : 1
  const pageSize = [20, 50, 100].includes(params.pageSize ?? 20) ? params.pageSize! : 20
  return { userId: parsedUserId, page: current - 1, size: pageSize }
}
