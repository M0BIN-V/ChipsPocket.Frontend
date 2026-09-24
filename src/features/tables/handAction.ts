import type { HandState, PlayerAction } from './hand.types'

export function getAvailableAction(handState: HandState, selectedAmount: number): PlayerAction {
  if (handState.currentPlayerId !== handState.myPlayerId) return 'CHECK'

  const resultingContribution = handState.myStreetContribution + selectedAmount
  if (resultingContribution >= handState.myRemainingStack + handState.myStreetContribution) return 'ALL-IN'
  if (handState.currentBet === 0) return selectedAmount > 0 ? 'BET' : 'CHECK'
  if (selectedAmount === 0) return 'FOLD'
  if (resultingContribution < handState.currentBet) return 'FOLD'
  if (resultingContribution === handState.currentBet) return 'CALL'
  return resultingContribution >= handState.minimumRaiseTo ? 'RAISE' : 'RAISE'
}