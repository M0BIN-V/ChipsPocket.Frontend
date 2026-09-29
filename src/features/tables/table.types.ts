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

export interface ActiveHandInfo {
  tableId: string
  argId: string
  dealerSeatId: string
  smallBlindSeatId: string
  bigBlindSeatId: string
  currentStreet: string
  waitingForActionDto: unknown
}

export interface TableInfoResponse {
  id: string
  name: string
  managerId: string
  activeHand: ActiveHandInfo | null
  seats: TableSeatInfo[]
}

export interface CreateHandResponse {
  handId: string
  dealerSeatId: string
  bigBlindSeatId: string
  smallBlindSeatId: string
}