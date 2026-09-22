export function buildTableJoinUrl(token: string): string {
  return new URL(`/join/${encodeURIComponent(token)}`, window.location.origin).toString()
}

export function getJoinTokenFromUrl(value: string): string | null {
  try {
    const url = new URL(value)
    if (url.origin !== window.location.origin) return null

    const match = url.pathname.match(/^\/join\/([^/]+)\/?$/)
    return match ? decodeURIComponent(match[1]) : null
  } catch {
    return null
  }
}