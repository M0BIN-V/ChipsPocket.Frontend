import chipData from '../../data/chips.json'
import type { Chip, ChipColor } from './hand.types'

export interface ChipDefinition {
  id: string
  name: string
  picture: string
  value: number
}

export const chipDefinitions: ChipDefinition[] = chipData.map((chip) => ({
  ...chip,
  id: chip.name.toLowerCase().replace(/\s+/g, '-'),
  picture: `/chips/${chip.picture}`,
}))

let visualChipSequence = 0

export function getChipsForAmount(amount: number): Chip[] {
  if (!Number.isSafeInteger(amount) || amount < 0) {
    throw new RangeError('Chip amounts must be non-negative safe integers.')
  }

  let remaining = amount
  const chips: Chip[] = []
  const denominations = [...chipDefinitions].sort((first, second) => second.value - first.value)

  for (const denomination of denominations) {
    const count = Math.floor(remaining / denomination.value)
    for (let index = 0; index < count; index += 1) {
      visualChipSequence += 1
      chips.push({
        id: `visual-chip-${visualChipSequence}`,
        color: denomination.name.toLowerCase().replace(/\s+/g, '-') as ChipColor,
        value: denomination.value,
        picture: denomination.picture,
        isMine: true,
      })
    }
    remaining -= count * denomination.value
    if (remaining === 0) break
  }

  return chips
}