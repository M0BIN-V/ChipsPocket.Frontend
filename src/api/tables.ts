import { apiClient } from './client'
import type { CreateTableRequest, CreateTableResponse, GetMyTablesResponse } from '../features/tables/table.types'

export async function createTable(request: CreateTableRequest): Promise<CreateTableResponse> {
  const response = await apiClient.post<CreateTableResponse>('/api/tables', request)
  return response.data
}

export async function getMyTables(): Promise<GetMyTablesResponse[]> {
  const response = await apiClient.get<GetMyTablesResponse[]>('/api/tables/my')
  return response.data
}