import { useEffect, useState } from 'react'
import axios from 'axios'
import { AlertTriangle, CheckCircle2, LoaderCircle, Minus, Plus, X } from 'lucide-react'
import { getChips } from '../../api/chips'
import { createBuyIn, createCashOut, getUserStack } from '../../api/buyIn'
import type { ChipAppearance, UserStackResponse } from './table.types'
import { getPlayerInitials } from './tableSeatLayout'

interface PlayerDetailsModalProps {
  tableId: string
  player: { id?: string; username: string }
  isManager: boolean
  onClose: () => void
}

function chipImage(picture: string): string {
  if (/^(https?:|data:|\/)/i.test(picture)) return picture
  const normalized = picture.toLowerCase().replace(/\s+/g, '-')
  return `/${normalized.includes('chip') ? normalized : `${normalized}-chip`}.png`
}

function getTransactionError(error: unknown, action: 'add' | 'remove'): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'Unable to connect to the server.'
    if (error.response.status === 401 || error.response.status === 403) return 'Only the table manager can manage chips.'
    if (error.response.status === 404) return 'This player is no longer in the table lobby.'
    if (error.response.status === 400) return action === 'remove' ? 'This player does not have enough of that chip.' : 'That chip is not available right now.'
  }
  return `Unable to ${action === 'add' ? 'add' : 'remove'} chips right now. Please try again.`
}

export function PlayerDetailsModal({ tableId, player, isManager, onClose }: PlayerDetailsModalProps) {
  const [stack, setStack] = useState<UserStackResponse | null>(null)
  const [chips, setChips] = useState<ChipAppearance[]>([])
  const [isLoading, setIsLoading] = useState(Boolean(player.id))
  const [processingChipId, setProcessingChipId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    if (!player.id) {
      return () => { isMounted = false }
    }

    Promise.all([getUserStack(tableId, player.id), getChips()]).then(([userStack, availableChips]) => {
      if (!isMounted) return
      setStack(userStack)
      setChips(availableChips)
    }).catch(() => {
      if (isMounted) setErrorMessage('Unable to load this player\'s chip details.')
    }).finally(() => {
      if (isMounted) setIsLoading(false)
    })
    return () => { isMounted = false }
  }, [player.id, tableId])

  async function handleChipChange(chip: ChipAppearance, direction: 'add' | 'remove') {
    if (!isManager || !player.id || processingChipId) return
    const currentCount = stack?.chips.find((stackChip) => stackChip.chipId === chip.id)?.count ?? 0
    if (direction === 'remove' && currentCount === 0) return

    setErrorMessage(null)
    setSuccessMessage(null)
    setProcessingChipId(chip.id)
    try {
      if (direction === 'add') {
        await createBuyIn(tableId, { destinationUserId: player.id, chipId: chip.id, chipCount: 1 })
      } else {
        await createCashOut(tableId, { sourceUserId: player.id, chipId: chip.id, chipCount: 1 })
      }
      setStack((currentStack) => {
        if (!currentStack) return currentStack
        const nextCount = currentCount + (direction === 'add' ? 1 : -1)
        const existingChip = currentStack.chips.find((stackChip) => stackChip.chipId === chip.id)
        const nextChips = existingChip
          ? currentStack.chips.map((stackChip) => stackChip.chipId === chip.id ? { ...stackChip, count: nextCount } : stackChip).filter((stackChip) => stackChip.count > 0)
          : [...currentStack.chips, { ...chip, chipId: chip.id, count: nextCount }]
        return { ...currentStack, chips: nextChips, totalValue: currentStack.totalValue + chip.value * (direction === 'add' ? 1 : -1) }
      })
      setSuccessMessage(`${direction === 'add' ? 'Added' : 'Removed'} one ${chip.name} ${direction === 'add' ? 'to' : 'from'} ${player.username}.`)
    } catch (error: unknown) {
      setErrorMessage(getTransactionError(error, direction))
    } finally {
      setProcessingChipId(null)
    }
  }

  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !processingChipId) onClose() }}>
      <section className="sheet-card player-details-sheet max-w-lg" role="dialog" aria-modal="true" aria-labelledby="player-details-title">
        <div className="sheet-header">
          <div><span className="eyebrow">Selected player</span><h2 id="player-details-title">Player Details</h2></div>
          <button className="icon-button" type="button" onClick={onClose} disabled={Boolean(processingChipId)} aria-label="Close player details"><X size={18} strokeWidth={2.2} /></button>
        </div>
        <div className="player-details-body">
          <div className="mt-6 flex items-center gap-4 rounded-2xl border border-[#b7d334]/25 bg-[#b7d334]/10 p-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-[#b7d334]/60 bg-[#b7d334]/15 font-['Space_Grotesk'] text-xl font-bold text-[#d9ed7a]" aria-label={`${player.username} avatar`}>{getPlayerInitials(player.username)}</div>
          <div className="min-w-0"><p className="truncate text-xl font-semibold text-white">{player.username}</p><p className="mt-1 text-sm text-[#a5aaa1]">At this table</p></div>
          </div>
          {isLoading && player.id && <div className="flex items-center justify-center gap-2 py-8 text-sm text-[#a5aaa1]"><LoaderCircle size={17} className="animate-spin" />Loading player details...</div>}
          {!isLoading && stack && <>
            <div className="mt-5 rounded-2xl bg-[#111311] p-4"><p className="text-xs uppercase tracking-[0.16em] text-[#8e968a]">Current balance</p><p className="mt-1 font-['Space_Grotesk'] text-3xl font-bold text-[#d9ed7a]">${stack.totalValue.toLocaleString()}</p></div>
            {isManager && <div className="mt-5 space-y-2" aria-label={`${player.username} chip balances`}>
              {chips.map((chip) => {
                const count = stack.chips.find((stackChip) => stackChip.chipId === chip.id)?.count ?? 0
                const isProcessing = processingChipId === chip.id
                return <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#111311] p-3" key={chip.id}>
                  <img className="h-11 w-11 shrink-0 object-contain" src={chipImage(chip.picture)} alt="" />
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-white">{chip.name}</span><span className="mt-1 block text-xs text-[#a5aaa1]">{count} chip{count === 1 ? '' : 's'}</span></span>
                  <button className="icon-button" type="button" onClick={() => { void handleChipChange(chip, 'remove') }} disabled={Boolean(processingChipId) || count === 0} aria-label={`Remove one ${chip.name}`}><Minus size={17} /></button>
                  <strong className="w-8 text-center font-['Space_Grotesk'] text-lg text-[#d9ed7a]" aria-live="polite">{isProcessing ? <LoaderCircle size={17} className="mx-auto animate-spin" /> : count}</strong>
                  <button className="icon-button" type="button" onClick={() => { void handleChipChange(chip, 'add') }} disabled={Boolean(processingChipId)} aria-label={`Add one ${chip.name}`}><Plus size={17} /></button>
                </div>
              })}
            </div>}
          </>}
          {(errorMessage || !player.id) && <div className="form-error mt-4" role="alert"><AlertTriangle size={16} strokeWidth={2.3} /><span>{errorMessage ?? 'Player details are unavailable until the lobby provides a user ID.'}</span></div>}
          {successMessage && <div className="form-success mt-4" role="status"><CheckCircle2 size={16} strokeWidth={2.3} /><span>{successMessage}</span></div>}
        </div>
      </section>
    </div>
  )
}