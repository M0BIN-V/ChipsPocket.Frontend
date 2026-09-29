import { useEffect, useState } from 'react'
import axios from 'axios'
import { AlertTriangle, CheckCircle2, LoaderCircle, Minus, Plus, X } from 'lucide-react'
import { addMemberBalance, deductMemberBalance, getMemberBalance } from '../../api/balance'
import { getPlayerInitials } from './tableSeatLayout'

interface PlayerDetailsModalProps {
  tableId: string
  player: { id?: string; username: string }
  isManager: boolean
  onBalanceChange: (memberId: string, balance: number) => void
  onClose: () => void
}

function getTransactionError(error: unknown, action: 'add' | 'remove'): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'Unable to connect to the server.'
    if (error.response.status === 401 || error.response.status === 403) return 'Only the table manager can adjust balances.'
    if (error.response.status === 404) return 'This player is no longer in the table lobby.'
    if (error.response.status === 400 && action === 'remove') return 'This player does not have enough balance.'
    if (error.response.status === 400) return 'Enter a valid positive amount.'
  }
  return `Unable to ${action === 'add' ? 'add' : 'remove'} money right now. Please try again.`
}

export function PlayerDetailsModal({ tableId, player, isManager, onBalanceChange, onClose }: PlayerDetailsModalProps) {
  const [balance, setBalance] = useState<number | null>(null)
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(Boolean(player.id))
  const [processingAction, setProcessingAction] = useState<'add' | 'remove' | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    if (!player.id) {
      return () => { isMounted = false }
    }

    getMemberBalance(tableId, player.id).then((currentBalance) => {
      if (!isMounted) return
      setBalance(currentBalance)
    }).catch(() => {
      if (isMounted) setErrorMessage('Unable to load this player\'s balance.')
    }).finally(() => {
      if (isMounted) setIsLoading(false)
    })
    return () => { isMounted = false }
  }, [player.id, tableId])

  async function handleBalanceChange(direction: 'add' | 'remove') {
    if (!isManager || !player.id || processingAction) return
    const numericAmount = Number(amount)
    if (!Number.isSafeInteger(numericAmount) || numericAmount < 1 || numericAmount > 2_147_483_647) {
      setErrorMessage('Enter a positive whole amount no greater than 2,147,483,647.')
      setSuccessMessage(null)
      return
    }
    if (direction === 'remove' && balance !== null && numericAmount > balance) {
      setErrorMessage('Amount exceeds this player\'s current balance.')
      setSuccessMessage(null)
      return
    }

    setErrorMessage(null)
    setSuccessMessage(null)
    setProcessingAction(direction)
    try {
      if (direction === 'add') {
        await addMemberBalance(tableId, player.id, { value: numericAmount })
      } else {
        await deductMemberBalance(tableId, player.id, { value: numericAmount })
      }
      const nextBalance = (balance ?? 0) + numericAmount * (direction === 'add' ? 1 : -1)
      setBalance(nextBalance)
      onBalanceChange(player.id, nextBalance)
      setSuccessMessage(`${direction === 'add' ? 'Added' : 'Removed'} $${numericAmount.toLocaleString()} ${direction === 'add' ? 'to' : 'from'} ${player.username}.`)
    } catch (error: unknown) {
      setErrorMessage(getTransactionError(error, direction))
    } finally {
      setProcessingAction(null)
    }
  }

  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !processingAction) onClose() }}>
      <section className="sheet-card player-details-sheet max-w-lg" role="dialog" aria-modal="true" aria-labelledby="player-details-title">
        <div className="sheet-header">
          <div><span className="eyebrow">Selected player</span><h2 id="player-details-title">Player Details</h2></div>
          <button className="icon-button" type="button" onClick={onClose} disabled={Boolean(processingAction)} aria-label="Close player details"><X size={18} strokeWidth={2.2} /></button>
        </div>
        <div className="player-details-body">
          <div className="mt-6 flex items-center gap-4 rounded-2xl border border-[#b7d334]/25 bg-[#b7d334]/10 p-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-[#b7d334]/60 bg-[#b7d334]/15 font-['Space_Grotesk'] text-xl font-bold text-[#d9ed7a]" aria-label={`${player.username} avatar`}>{getPlayerInitials(player.username)}</div>
          <div className="min-w-0"><p className="truncate text-xl font-semibold text-white">{player.username}</p><p className="mt-1 text-sm text-[#a5aaa1]">At this table</p></div>
          </div>
          {isLoading && player.id && <div className="flex items-center justify-center gap-2 py-8 text-sm text-[#a5aaa1]"><LoaderCircle size={17} className="animate-spin" />Loading player details...</div>}
          {!isLoading && balance !== null && <>
            <div className="mt-5 rounded-2xl bg-[#111311] p-4"><p className="text-xs uppercase tracking-[0.16em] text-[#8e968a]">Current balance</p><p className="mt-1 font-['Space_Grotesk'] text-3xl font-bold text-[#d9ed7a]">${balance.toLocaleString()}</p></div>
            {isManager && <div className="mt-5" aria-label={`${player.username} balance adjustment`}>
              <label className="block text-sm font-medium text-white" htmlFor="balance-adjustment-amount">Amount</label>
              <div className="relative mt-2">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#a5aaa1]">$</span>
                <input id="balance-adjustment-amount" className="w-full rounded-xl border border-white/10 bg-[#111311] py-3 pl-8 pr-3 font-['Space_Grotesk'] text-lg text-white outline-none focus:border-[#b7d334]" type="number" min="1" max="2147483647" step="1" inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} disabled={Boolean(processingAction)} />
              </div>
              <div className="mt-3 flex gap-3">
                <button className="ghost-button flex-1 justify-center" type="button" onClick={() => { void handleBalanceChange('add') }} disabled={Boolean(processingAction) || isLoading || !amount}>
                  {processingAction === 'add' ? <LoaderCircle size={17} className="animate-spin" /> : <Plus size={17} />} Add Money
                </button>
                <button className="ghost-button flex-1 justify-center" type="button" onClick={() => { void handleBalanceChange('remove') }} disabled={Boolean(processingAction) || isLoading || !amount}>
                  {processingAction === 'remove' ? <LoaderCircle size={17} className="animate-spin" /> : <Minus size={17} />} Remove Money
                </button>
              </div>
            </div>}
          </>}
          {(errorMessage || !player.id) && <div className="form-error mt-4" role="alert"><AlertTriangle size={16} strokeWidth={2.3} /><span>{errorMessage ?? 'Player details are unavailable until the lobby provides a user ID.'}</span></div>}
          {successMessage && <div className="form-success mt-4" role="status"><CheckCircle2 size={16} strokeWidth={2.3} /><span>{successMessage}</span></div>}
        </div>
      </section>
    </div>
  )
}