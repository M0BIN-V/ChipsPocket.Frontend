import { apiClient } from './client'
import type { GetJoinTokenResponse, JoinResponse, LobbyUserResponse, TableInfoResponse } from '../features/tables/table.types'

export async function getTableJoinToken(tableId: string): Promise<string> {
  const response = await apiClient.get<GetJoinTokenResponse>(`/api/tables/lobby/${encodeURIComponent(tableId)}/join-token`)
  return response.data.token
}

export async function getTableLobbyUsers(tableId: string): Promise<LobbyUserResponse[]> {
  const response = await apiClient.get<LobbyUserResponse[]>(`/api/tables/lobby/${encodeURIComponent(tableId)}`)
  return response.data
}

export async function joinTableWithToken(token: string): Promise<string> {
  const response = await apiClient.post<JoinResponse>(`/api/tables/lobby/join/${encodeURIComponent(token)}`)
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