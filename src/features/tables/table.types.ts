export interface ChipAppearance {
  id: string
  name: string
  value: number
  picture: string
}

export interface SelectedChip {
  chipId: string
  chip: ChipAppearance
}

export interface BuyInRequest {
  destinationUserId: string
  chipId: string
  chipCount: number
}

export interface CashOutRequest {
  sourceUserId: string
  chipId: string
  chipCount: number
}

export interface UserStackChipResponse {
  chipId: string
  name: string
  picture: string
  value: number
  count: number
}

export interface UserStackResponse {
  userId: string
  totalValue: number
  chips: UserStackChipResponse[]
}

export interface CreateTableForm {
  tableName: string
  bigBlindAmount: string
  smallBlindAmount: string
}

export interface CreateTableRequest {
  tableName: string
  bigBlindAmount: number
  smallBlindAmount: number
}

export interface CreateTableResponse {
  id: string
}

export interface GetJoinTokenResponse {
  token: string
}

export interface GetMyTablesResponse {
  tableId: string
  tableName: string
  createdAt: string
}

export interface MemberResponse {
  id: string
  username: string
}

export interface JoinResponse {
  tableId: string
}

export interface TableSeatInfo {
  id: string
  order: number
  user: { id?: string; username: string } | null
}

export interface TableInfoResponse {
  id: string
  name: string
  managerId: string
  isRunning: boolean
  seats: TableSeatInfo[]
}