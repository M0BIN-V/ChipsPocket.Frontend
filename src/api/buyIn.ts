import { apiClient } from './client'
import type { BuyInRequest, UserStackResponse } from '../features/tables/table.types'

export async function getUserStack(tableId: string, userId: string): Promise<UserStackResponse> {
  const response = await apiClient.get<UserStackResponse>(`/api/tables/${encodeURIComponent(tableId)}/user-stack/${encodeURIComponent(userId)}`)
  return response.data
}

export async function createBuyIn(tableId: string, request: BuyInRequest): Promise<void> {
  await apiClient.post(`/api/tables/${encodeURIComponent(tableId)}/buy-in`, request)
}