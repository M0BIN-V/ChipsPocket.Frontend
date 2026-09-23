import { useEffect, useState } from 'react'
import axios from 'axios'
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, LoaderCircle, Plus, X } from 'lucide-react'
import { getChips } from '../../api/chips'
import { createBuyIn, getUserStack } from '../../api/buyIn'
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

function getBuyInError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'Unable to connect to the server.'
    if (error.response.status === 401 || error.response.status === 403) return 'Only the table manager can add chips.'
    if (error.response.status === 404) return 'This player is no longer in the table lobby.'
    if (error.response.status === 400) return 'Check the chip and quantity, then try again.'
  }
  return 'Unable to add chips right now. Please try again.'
}

export function PlayerDetailsModal({ tableId, player, isManager, onClose }: PlayerDetailsModalProps) {
  const [stack, setStack] = useState<UserStackResponse | null>(null)
  const [chips, setChips] = useState<ChipAppearance[]>([])
  const [isLoading, setIsLoading] = useState(Boolean(player.id))
  const [isAddingChips, setIsAddingChips] = useState(false)
  const [showBuyIn, setShowBuyIn] = useState(false)
  const [selectedChipId, setSelectedChipId] = useState('')
  const [chipCount, setChipCount] = useState(1)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const selectedChip = chips.find((chip) => chip.id === selectedChipId)
  const totalValue = (selectedChip?.value ?? 0) * chipCount

  useEffect(() => {
    let isMounted = true
    if (!player.id) {
      return () => { isMounted = false }
    }

    Promise.all([getUserStack(tableId, player.id), getChips()]).then(([userStack, availableChips]) => {
      if (!isMounted) return
      setStack(userStack)
      setChips(availableChips)
      setSelectedChipId(availableChips[0]?.id ?? '')
    }).catch(() => {
      if (isMounted) setErrorMessage('Unable to load this player\'s chip details.')
    }).finally(() => {
      if (isMounted) setIsLoading(false)
    })
    return () => { isMounted = false }
  }, [player.id, tableId])

  async function handleAddChips() {
    if (!isManager || !player.id || !selectedChipId || chipCount < 1 || isAddingChips) return
    setErrorMessage(null)
    setSuccessMessage(null)
    setIsAddingChips(true)
    try {
      await createBuyIn(tableId, { destinationUserId: player.id, chipId: selectedChipId, chipCount })
      const refreshedStack = await getUserStack(tableId, player.id)
      setStack(refreshedStack)
      setShowBuyIn(false)
      setSuccessMessage(`Added ${chipCount} ${selectedChip?.name ?? 'chip'}${chipCount === 1 ? '' : 's'} to ${player.username}.`)
    } catch (error: unknown) {
      setErrorMessage(getBuyInError(error))
    } finally {
      setIsAddingChips(false)
    }
  }

  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isAddingChips) onClose() }}>
      <section className="sheet-card player-details-sheet max-w-lg" role="dialog" aria-modal="true" aria-labelledby="player-details-title">
        <div className="sheet-header">
          <div><span className="eyebrow">Selected player</span><h2 id="player-details-title">Player Details</h2></div>
          <button className="icon-button" type="button" onClick={onClose} disabled={isAddingChips} aria-label="Close player details"><X size={18} strokeWidth={2.2} /></button>
        </div>
        <div className="player-details-body">
          <div className="mt-6 flex items-center gap-4 rounded-2xl border border-[#b7d334]/25 bg-[#b7d334]/10 p-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-[#b7d334]/60 bg-[#b7d334]/15 font-['Space_Grotesk'] text-xl font-bold text-[#d9ed7a]" aria-label={`${player.username} avatar`}>{getPlayerInitials(player.username)}</div>
          <div className="min-w-0"><p className="truncate text-xl font-semibold text-white">{player.username}</p><p className="mt-1 text-sm text-[#a5aaa1]">At this table</p></div>
          </div>
          {isLoading && player.id && <div className="flex items-center justify-center gap-2 py-8 text-sm text-[#a5aaa1]"><LoaderCircle size={17} className="animate-spin" />Loading player details...</div>}
          {!isLoading && stack && <div className="mt-5 rounded-2xl bg-[#111311] p-4"><p className="text-xs uppercase tracking-[0.16em] text-[#8e968a]">Current balance</p><p className="mt-1 font-['Space_Grotesk'] text-3xl font-bold text-[#d9ed7a]">${stack.totalValue.toLocaleString()}</p><p className="mt-2 text-sm text-[#a5aaa1]">{stack.chips.length ? stack.chips.map((chip) => `${chip.count} ${chip.name}`).join(' · ') : 'No chips yet'}</p></div>}
          {(errorMessage || !player.id) && <div className="form-error mt-4" role="alert"><AlertTriangle size={16} strokeWidth={2.3} /><span>{errorMessage ?? 'Player details are unavailable until the lobby provides a user ID.'}</span></div>}
          {successMessage && <div className="form-success mt-4" role="status"><CheckCircle2 size={16} strokeWidth={2.3} /><span>{successMessage}</span></div>}
          {isManager && player.id && !showBuyIn && <button className="primary-button mt-5" type="button" onClick={() => { setErrorMessage(null); setSuccessMessage(null); setShowBuyIn(true) }} disabled={isLoading}><Plus size={18} strokeWidth={2.3} />Add Chips</button>}
          {isManager && showBuyIn && <div className="mt-5 border-t border-white/10 pt-5"><div className="flex items-center justify-between"><h3 className="font-['Space_Grotesk'] text-lg font-bold text-white">Add chips</h3><button className="icon-button" type="button" onClick={() => setShowBuyIn(false)} disabled={isAddingChips} aria-label="Close add chips form"><X size={17} /></button></div>
          <div className="mt-4 flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain pb-2">{chips.map((chip) => <button className={`w-32 shrink-0 snap-start rounded-2xl border p-3 text-left transition ${selectedChipId === chip.id ? 'border-[#b7d334] bg-[#b7d334]/15' : 'border-white/10 bg-[#111311] hover:border-white/25'}`} key={chip.id} type="button" onClick={() => setSelectedChipId(chip.id)}><img className="mx-auto h-14 w-14 object-contain" src={chipImage(chip.picture)} alt="" /><span className="mt-2 block truncate text-sm font-semibold text-white">{chip.name}</span><span className="mt-1 block text-xs text-[#a5aaa1]">${chip.value}</span></button>)}</div>
          <div className="mt-5"><label className="text-sm font-medium text-[#dfe5d7]" htmlFor="chip-count">Quantity</label><div className="mt-2 flex items-center gap-3"><button className="icon-button" type="button" onClick={() => setChipCount((count) => Math.max(1, count - 1))} disabled={isAddingChips || chipCount <= 1} aria-label="Decrease chip quantity"><ChevronDown size={18} /></button><input className="form-input text-center" id="chip-count" type="number" min="1" max="100000" value={chipCount} onChange={(event) => setChipCount(Math.max(1, Number(event.target.value) || 1))} disabled={isAddingChips} /><button className="icon-button" type="button" onClick={() => setChipCount((count) => Math.min(100000, count + 1))} disabled={isAddingChips} aria-label="Increase chip quantity"><ChevronUp size={18} /></button></div></div>
          <div className="mt-5 flex items-end justify-between rounded-2xl bg-[#b7d334]/10 p-4"><span className="text-sm text-[#a5aaa1]">Total value</span><strong className="font-['Space_Grotesk'] text-2xl text-[#d9ed7a]">${totalValue.toLocaleString()}</strong></div>
          <button className="primary-button mt-4" type="button" onClick={() => { void handleAddChips() }} disabled={isAddingChips || !selectedChip || chipCount < 1}>{isAddingChips ? <LoaderCircle size={18} className="animate-spin" /> : <Plus size={18} strokeWidth={2.3} />}{isAddingChips ? 'Adding chips...' : `Add $${totalValue.toLocaleString()}`}</button>
          </div>}
        </div>
      </section>
    </div>
  )
}