export interface ChipAppearance {
  id: string
  name: string
  picture: string
  color: string
}

export interface SelectedChip {
  appearanceId: string
  appearance: ChipAppearance
  value: number
}

export interface CreateTableForm {
  tableName: string
  seatCount: number
  chips: SelectedChip[]
}

export interface CreateTableRequest {
  tableName: string
  seatCount: number
  chips: Array<{ appearanceId: string; value: number }>
}