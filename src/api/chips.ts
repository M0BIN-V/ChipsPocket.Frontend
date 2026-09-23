import { apiClient } from './client'
import type { ChipAppearance } from '../features/tables/table.types'

export async function getChips(): Promise<ChipAppearance[]> {
  const response = await apiClient.get<Array<{ chipId: string; name: string; value: number; picture: string }>>('/api/chips/chips')
  return response.data.map((chip) => ({ id: chip.chipId, name: chip.name, value: chip.value, picture: chip.picture }))
}