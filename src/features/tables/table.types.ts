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
}

export interface CreateTableRequest {
  tableName: string
}

export interface CreateTableResponse {
  id: string
}

export interface GetJoinTokenResponse {
  token: string
}