export function buildTableJoinUrl(tableId: string): string {
  return new URL(`/tables/${encodeURIComponent(tableId)}/join`, window.location.origin).toString()
}

export function getTableIdFromJoinUrl(value: string): string | null {
  try {
    const url = new URL(value)
    if (url.origin !== window.location.origin) return null

    const match = url.pathname.match(/^\/tables\/([^/]+)\/join\/?$/)
    return match ? decodeURIComponent(match[1]) : null
  } catch {
    return null
  }
}