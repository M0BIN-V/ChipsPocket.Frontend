import type { HandState, PlayerAction } from '../features/tables/hand.types'
import { getChipsForAmount } from '../features/tables/chipDefinitions'

export interface HandService {
  getHandState(handId: string, tableId: string): Promise<HandState>
  submitAction(handId: string, action: PlayerAction, chips: string[]): Promise<void>
}

// TODO: Replace mock implementation when the Hand API is available.
export const mockHandService: HandService = {
  async getHandState(handId, tableId) {
    const chips = getChipsForAmount(1_850)
    const potChips = getChipsForAmount(225).map((chip) => ({ ...chip, isMine: false }))

    return {
      handId,
      tableId,
      pot: 450,
      currentBet: 100,
      currentPlayerId: 'me',
      dealerSeatId: 'seat-1',
      smallBlindSeatId: 'seat-2',
      bigBlindSeatId: 'seat-3',
      myPlayerId: 'me',
      myStreetContribution: 50,
      myHandContribution: 50,
      myRemainingStack: 1_850,
      minimumRaiseTo: 200,
      players: [
        { id: 'ali', name: 'Ali', seat: 1, role: 'Dealer', remainingStack: 850, roundContribution: 100 },
        { id: 'reza', name: 'Reza', seat: 2, role: 'Small Blind', remainingStack: 620, roundContribution: 50 },
        { id: 'mobin', name: 'Mobin', seat: 3, role: 'Big Blind', remainingStack: 1_240, roundContribution: 100 },
        { id: 'me', name: 'Amir', seat: 4, role: 'Player', remainingStack: 1_850, roundContribution: 50 },
        { id: 'mona', name: 'Mona', seat: 5, role: 'Player', remainingStack: 930, roundContribution: 50 },
        { id: 'sara', name: 'Sara', seat: 6, role: 'Player', remainingStack: 1_500, roundContribution: 0 },
        { id: 'nima', name: 'Nima', seat: 7, role: 'Player', remainingStack: 780, roundContribution: 0 },
        { id: 'kian', name: 'Kian', seat: 8, role: 'Player', remainingStack: 2_100, roundContribution: 50 },
        { id: 'tara', name: 'Tara', seat: 9, role: 'Player', remainingStack: 1_075, roundContribution: 25 },
        { id: 'arman', name: 'Arman', seat: 10, role: 'Player', remainingStack: 1_325, roundContribution: 25 },
      ],
      myStack: [
        { id: 'stack-main', chips: chips.slice(0, 3), position: { x: 0.5, y: 0.76 } },
        { id: 'stack-green', chips: chips.slice(3, 5), position: { x: 0.63, y: 0.78 } },
        { id: 'stack-high', chips: chips.slice(5), position: { x: 0.38, y: 0.78 } },
      ],
      potChips: [
        { id: 'pot-stack', chips: potChips.slice(0, 2), position: { x: 0.45, y: 0.46 } },
        { id: 'pot-green', chips: potChips.slice(2), position: { x: 0.56, y: 0.48 } },
      ],
    }
  },
  async submitAction() {
    // TODO: Replace with the real submit action endpoint.
    await Promise.resolve()
  },
}