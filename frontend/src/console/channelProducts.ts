import { allowedConsolePlatforms } from './navigation'

export function channelProductsForScope(scope: string): string[] {
  const platforms = allowedConsolePlatforms(scope)
  return !scope.trim() || scope.trim() === '*' ? ['ALL', ...platforms] : platforms
}
