import type { Chip, HandState } from './hand.types'

export interface ChipChangeService {
  change(hand: HandState, chipId: string, replacements: Chip[]): HandState
}

export const mockChipChangeService: ChipChangeService = {
  change(hand, chipId, replacements) {
    const sourceStack = hand.myStack.find((stack) => stack.chips.some((chip) => chip.id === chipId && chip.isMine))
    const sourceChip = sourceStack?.chips.find((chip) => chip.id === chipId)
    if (!sourceStack || !sourceChip) throw new Error('The selected chip is not available in your stack.')
    if (replacements.reduce((total, chip) => total + chip.value, 0) !== sourceChip.value) {
      throw new Error('Replacement chips must have the same total value.')
    }

    return {
      ...hand,
      myStack: hand.myStack.map((stack) => {
        if (stack.id !== sourceStack.id) return stack
        const chipIndex = stack.chips.findIndex((chip) => chip.id === chipId)
        return {
          ...stack,
          chips: [
            ...stack.chips.slice(0, chipIndex),
            ...replacements,
            ...stack.chips.slice(chipIndex + 1),
          ],
        }
      }),
    }
  },
}