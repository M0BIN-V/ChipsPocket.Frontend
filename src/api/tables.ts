import { apiClient } from './client'
import type { CreateTableRequest, CreateTableResponse } from '../features/tables/table.types'

export async function createTable(request: CreateTableRequest): Promise<CreateTableResponse> {
  const response = await apiClient.post<CreateTableResponse>('/api/tables', request)
  return response.data
}