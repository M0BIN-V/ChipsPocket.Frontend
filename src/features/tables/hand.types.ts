export type ChipColor = 'red' | 'green' | 'black' | 'yellow' | 'blue' | 'white' | 'grey' | 'orange' | 'pink' | 'purple' | 'light-blue' | 'brown'

export interface Chip {
  id: string
  color: ChipColor
  value: number
  picture?: string
  isMine?: boolean
}

export interface ChipStack {
  id: string
  chips: Chip[]
  position: { x: number; y: number }
}

export interface HandPlayer {
  id: string
  name: string
  seat: number
  role: 'Dealer' | 'Small Blind' | 'Big Blind' | 'Player'
  remainingStack: number
  roundContribution: number
}

export interface HandState {
  handId: string
  tableId: string
  pot: number
  currentBet: number
  currentPlayerId: string
  dealerSeatId: string
  smallBlindSeatId: string
  bigBlindSeatId: string
  players: HandPlayer[]
  myPlayerId: string
  myStreetContribution: number
  myHandContribution: number
  myRemainingStack: number
  minimumRaiseTo: number
  myStack: ChipStack[]
  potChips: ChipStack[]
}

export type PlayerAction = 'CHECK' | 'BET' | 'CALL' | 'RAISE' | 'FOLD' | 'ALL-IN'