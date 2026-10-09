type ConsoleLinkClick = {
  button: number
  defaultPrevented: boolean
  altKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  currentTarget: {
    target: string
    hasAttribute: (name: string) => boolean
  }
}

export function shouldNavigateWithinConsole(event: ConsoleLinkClick, href: string) {
  return (href === '/console' || href.startsWith('/console/'))
    && event.button === 0
    && !event.defaultPrevented
    && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey
    && (!event.currentTarget.target || event.currentTarget.target === '_self')
    && !event.currentTarget.hasAttribute('download')
}
