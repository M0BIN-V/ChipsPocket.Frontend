export function buildTableJoinUrl(tableId: string): string {
  return new URL(`/tables/${encodeURIComponent(tableId)}/join`, window.location.origin).toString()
}