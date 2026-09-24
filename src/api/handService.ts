import type { HandState, PlayerAction } from '../features/tables/hand.types'
import { chipAppearanceService } from '../features/tables/chipAppearanceService'

export interface HandService {
  getHandState(handId: string, tableId: string): Promise<HandState>
  submitAction(handId: string, action: PlayerAction, chips: string[]): Promise<void>
}

const mockChips = [
  { id: 'chip-red-1', color: 'red' as const, value: 100 },
  { id: 'chip-red-2', color: 'red' as const, value: 100 },
  { id: 'chip-red-3', color: 'red' as const, value: 100 },
  { id: 'chip-green-1', color: 'green' as const, value: 25 },
  { id: 'chip-green-2', color: 'green' as const, value: 25 },
  { id: 'chip-black-1', color: 'black' as const, value: 500 },
  { id: 'chip-yellow-1', color: 'yellow' as const, value: 1_000 },
]

// TODO: Replace mock implementation when the Hand API is available.
export const mockHandService: HandService = {
  async getHandState(handId, tableId) {
    const appearances = await chipAppearanceService.getAll().catch(() => [])
    const pictureFor = (color: string, value: number) => {
      const appearance = appearances.find((chip) => chip.value === value || chip.name.toLowerCase().includes(color))
      const picture = appearance?.picture ?? color
      if (/^(https?:|data:|\/)/i.test(picture)) return picture
      const normalized = picture.toLowerCase().replace(/\s+/g, '-')
      return `/${normalized.includes('chip') ? normalized : `${normalized}-chip`}.png`
    }
    const chips = mockChips.map((chip) => ({ ...chip, picture: pictureFor(chip.color, chip.value), isMine: true }))

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
        { id: 'ali', name: 'Ali', seat: 1, role: 'Dealer', remainingStack: 850 },
        { id: 'reza', name: 'Reza', seat: 2, role: 'Small Blind', remainingStack: 620 },
        { id: 'mobin', name: 'Mobin', seat: 3, role: 'Big Blind', remainingStack: 1_240 },
        { id: 'me', name: 'Amir', seat: 4, role: 'Player', remainingStack: 1_850 },
      ],
      myStack: [
        { id: 'stack-main', chips: chips.slice(0, 3), position: { x: 0.5, y: 0.76 } },
        { id: 'stack-green', chips: chips.slice(3, 5), position: { x: 0.63, y: 0.78 } },
        { id: 'stack-high', chips: chips.slice(5), position: { x: 0.38, y: 0.78 } },
      ],
      potChips: [
        { id: 'pot-stack', chips: [{ id: 'pot-red-1', color: 'red', value: 100, picture: pictureFor('red', 100), isMine: false }, { id: 'pot-red-2', color: 'red', value: 100, picture: pictureFor('red', 100), isMine: false }], position: { x: 0.45, y: 0.46 } },
        { id: 'pot-green', chips: [{ id: 'pot-green-1', color: 'green', value: 25, picture: pictureFor('green', 25), isMine: false }], position: { x: 0.56, y: 0.48 } },
      ],
    }
  },
  async submitAction() {
    // TODO: Replace with the real submit action endpoint.
    await Promise.resolve()
  },
}