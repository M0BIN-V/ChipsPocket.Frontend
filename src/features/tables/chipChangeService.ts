import type { Chip, HandState } from './hand.types'

export interface ChipChangeService {
  change(hand: HandState, sourceChipIds: string | string[], replacements: Chip[]): HandState
}

export function getChipValueTotal(chips: readonly Pick<Chip, 'value'>[]): number {
  return chips.reduce((total, chip) => total + chip.value, 0)
}

export function canAddReplacementChip(sourceValue: number, selectedValue: number, denominationValue: number): boolean {
  return denominationValue > 0 && selectedValue + denominationValue <= sourceValue
}

export function canConfirmChipChange(sourceValue: number, selectedValue: number): boolean {
  return sourceValue > 0 && selectedValue === sourceValue
}

export const mockChipChangeService: ChipChangeService = {
  change(hand, selectedChipIds, replacements) {
    const sourceChipIds = new Set(Array.isArray(selectedChipIds) ? selectedChipIds : [selectedChipIds])
    const sourceStack = hand.myStack.find((stack) => sourceChipIds.size > 0 && [...sourceChipIds].every((chipId) => stack.chips.some((chip) => chip.id === chipId && chip.isMine)))
    const sourceChips = sourceStack?.chips.filter((chip) => sourceChipIds.has(chip.id)) ?? []
    if (!sourceStack || sourceChips.length !== sourceChipIds.size) throw new Error('The selected chips are not available in your stack.')
    if (getChipValueTotal(replacements) !== getChipValueTotal(sourceChips)) {
      throw new Error('Replacement chips must have the same total value.')
    }

    return {
      ...hand,
      myStack: hand.myStack.map((stack) => {
        if (stack.id !== sourceStack.id) return stack
        const chipIndex = stack.chips.findIndex((chip) => sourceChipIds.has(chip.id))
        let replacementsInserted = false
        const chips = stack.chips.flatMap((chip) => {
          if (!sourceChipIds.has(chip.id)) return [chip]
          if (replacementsInserted) return []
          replacementsInserted = true
          return replacements
        })
        return {
          ...stack,
          chips: chipIndex < 0 ? stack.chips : chips,
        }
      }),
    }
  },
}