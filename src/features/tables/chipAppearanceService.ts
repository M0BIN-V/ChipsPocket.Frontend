import { getChips } from '../../api/chips'
import type { ChipAppearance } from './table.types'

export interface ChipAppearanceService {
  getAll(): Promise<ChipAppearance[]>
}

export class ApiChipAppearanceService implements ChipAppearanceService {
  async getAll(): Promise<ChipAppearance[]> {
    return getChips()
  }
}

export const chipAppearanceService: ChipAppearanceService = new ApiChipAppearanceService()