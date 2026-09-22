import { apiClient } from './client'
import type { GetJoinTokenResponse } from '../features/tables/table.types'

export async function getTableJoinToken(tableId: string): Promise<string> {
  const response = await apiClient.get<GetJoinTokenResponse>(`/api/tables/lobby/${encodeURIComponent(tableId)}/join-token`)
  return response.data.token
}

export async function joinTableWithToken(token: string): Promise<void> {
  await apiClient.post(`/api/tables/lobby/join/${encodeURIComponent(token)}`)
}