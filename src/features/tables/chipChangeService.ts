import type { Chip, HandState } from './hand.types'
import type { ChipAppearance } from './table.types'

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

export function getAutoFillReplacementCounts(
  sourceValue: number,
  selectedValue: number,
  denominations: readonly Pick<ChipAppearance, 'id' | 'value'>[],
): Record<string, number> | null {
  const remainingValue = sourceValue - selectedValue
  if (!Number.isSafeInteger(remainingValue) || remainingValue < 0) return null
  if (remainingValue === 0) return {}

  const available = denominations
    .filter((denomination) => Number.isSafeInteger(denomination.value) && denomination.value > 0)
    .sort((first, second) => second.value - first.value || first.id.localeCompare(second.id))
  const bestCounts: (number[] | undefined)[] = Array.from({ length: remainingValue + 1 })
  bestCounts[0] = Array.from({ length: available.length }, () => 0)

  function chipCount(counts: number[]) {
    return counts.reduce((total, count) => total + count, 0)
  }

  function isBetter(candidate: number[], current: number[] | undefined) {
    if (!current) return true
    const candidateTotal = chipCount(candidate)
    const currentTotal = chipCount(current)
    if (candidateTotal !== currentTotal) return candidateTotal < currentTotal
    for (let index = 0; index < candidate.length; index += 1) {
      if (candidate[index] !== current[index]) return candidate[index] > current[index]
    }
    return false
  }

  for (let total = 1; total <= remainingValue; total += 1) {
    for (let index = 0; index < available.length; index += 1) {
      const denominationValue = available[index].value
      const previous = bestCounts[total - denominationValue]
      if (!previous) continue
      const candidate = [...previous]
      candidate[index] += 1
      if (isBetter(candidate, bestCounts[total])) bestCounts[total] = candidate
    }
  }

  const counts = bestCounts[remainingValue]
  if (!counts) return null
  return Object.fromEntries(available.flatMap((denomination, index) => counts[index] > 0 ? [[denomination.id, counts[index]]] : []))
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