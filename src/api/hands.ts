import { apiClient } from './client'
import type { CreateHandResponse } from '../features/tables/table.types'

export async function createHand(tableId: string): Promise<CreateHandResponse> {
  const response = await apiClient.post<CreateHandResponse>(`/api/tables/${encodeURIComponent(tableId)}/hands`)
  return response.data
}