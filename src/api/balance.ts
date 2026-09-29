import { apiClient } from './client'

export interface BalanceRequest {
  value: number
}

interface BalanceResponse {
  value: number | string
}

function balancePath(tableId: string, memberId: string): string {
  return `/api/tables/${encodeURIComponent(tableId)}/members/${encodeURIComponent(memberId)}/balance`
}

export async function getMemberBalance(tableId: string, memberId: string): Promise<number> {
  const response = await apiClient.get<BalanceResponse>(balancePath(tableId, memberId))
  return Number(response.data.value)
}

export async function addMemberBalance(tableId: string, memberId: string, request: BalanceRequest): Promise<void> {
  await apiClient.post(balancePath(tableId, memberId), request)
}

export async function deductMemberBalance(tableId: string, memberId: string, request: BalanceRequest): Promise<void> {
  await apiClient.delete(balancePath(tableId, memberId), { data: request })
}