import { apiClient } from './client'
import type { GetJoinTokenResponse, JoinResponse, MemberResponse, TableInfoResponse } from '../features/tables/table.types'

export async function getTableJoinToken(tableId: string): Promise<string> {
  const response = await apiClient.get<GetJoinTokenResponse>(`/api/tables/members/${encodeURIComponent(tableId)}/join-token`)
  return response.data.token
}

export async function getTableMembers(tableId: string): Promise<MemberResponse[]> {
  const response = await apiClient.get<MemberResponse[]>(`/api/tables/members/${encodeURIComponent(tableId)}`)
  return response.data
}

export async function joinTableWithToken(token: string): Promise<string> {
  const response = await apiClient.post<JoinResponse>(`/api/tables/members/join/${encodeURIComponent(token)}`)
  return response.data.tableId
}

export async function getTableInfo(tableId: string): Promise<TableInfoResponse> {
  const response = await apiClient.get<TableInfoResponse>(`/api/tables/${encodeURIComponent(tableId)}`)
  return response.data
}

export async function claimTableSeat(tableId: string, seatId: string): Promise<void> {
  await apiClient.post(`/api/tables/${encodeURIComponent(tableId)}/seats/${encodeURIComponent(seatId)}/claim`)
}

export async function releaseTableSeat(tableId: string, seatId: string): Promise<void> {
  await apiClient.post(`/api/tables/${encodeURIComponent(tableId)}/seats/${encodeURIComponent(seatId)}/release`)
}