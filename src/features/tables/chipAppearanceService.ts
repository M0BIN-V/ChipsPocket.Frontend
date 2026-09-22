import type { ChipAppearance } from './table.types'

export interface ChipAppearanceService {
  getAll(): Promise<ChipAppearance[]>
}

const mockChipAppearances: ChipAppearance[] = [
  { id: 'blue', name: 'Blue', picture: '●', color: '#6ea8fe' },
  { id: 'red', name: 'Red', picture: '●', color: '#ee765d' },
  { id: 'black', name: 'Black', picture: '●', color: '#aeb7ad' },
  { id: 'green', name: 'Green', picture: '●', color: '#7fc58a' },
  { id: 'white', name: 'White', picture: '●', color: '#f4f0e4' },
]

export class MockChipAppearanceService implements ChipAppearanceService {
  async getAll(): Promise<ChipAppearance[]> {
    return mockChipAppearances
  }
}

export const chipAppearanceService: ChipAppearanceService = new MockChipAppearanceService()