import type { ConsolePlatform } from './navigation'

export function onlyConsolePlatform<T extends { platformCode: string }>(items: T[], platform: ConsolePlatform): T[] {
  return items.filter((item) => item.platformCode.toUpperCase() === platform)
}
