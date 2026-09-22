import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { getMe } from '../../api/auth'
import { authStorage } from '../../api/authStorage'
import { getTableJoinToken } from '../../api/tableLobby'
import { getPlayerInitials, mockPlayers, seatPositions } from './mockTableData'
import { buildTableJoinUrl } from './tableShare'

interface TableLocationState {
  joinToken?: string
  tableId?: string
  tableName?: string
}

export function TablePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { tableId: routeTableId } = useParams<{ tableId: string }>()
  const tableState = location.state as TableLocationState | null
  const [currentUserName, setCurrentUserName] = useState('You')
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [joinToken, setJoinToken] = useState<string | null>(tableState?.joinToken ?? null)
  const [shareError, setShareError] = useState<string | null>(null)
  const tableId = routeTableId?.trim() || tableState?.tableId?.trim()
  const tableName = tableState?.tableName ?? 'Poker table'
  const joinUrl = joinToken ? buildTableJoinUrl(joinToken) : null

  useEffect(() => {
    if (tableState?.joinToken) return
    if (!tableId) return
    let isMounted = true
    getTableJoinToken(tableId).then((token) => {
      if (isMounted) setJoinToken(token)
    }).catch(() => {
      if (isMounted) setShareError('Join information is unavailable. Only the table owner can generate a join code.')
    })
    return () => { isMounted = false }
  }, [tableId, tableState?.joinToken])

  useEffect(() => {
    let isMounted = true
    getMe().then((user) => {
      if (isMounted) setCurrentUserName(user.username)
    }).catch(() => {})
    return () => { isMounted = false }
  }, [])

  useEffect(() => {
    if (!isShareOpen) return
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsShareOpen(false)
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isShareOpen])

  function handleLogout() {
    authStorage.clear()
    navigate('/login', { replace: true })
  }

  const occupiedSeats = new Map(mockPlayers.map((player) => [player.seat, player]))
  const currentUserInitials = getPlayerInitials(currentUserName)

  return (
    <main className="table-page min-h-screen bg-[#111311] px-4 py-5 text-[#f7f6f2] sm:px-8 sm:py-7">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex items-center justify-between gap-4">
          <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 text-xl text-[#c3c8bd] transition hover:border-white/25 focus:outline-none focus:ring-2 focus:ring-[#b7d334]/40" type="button" onClick={() => navigate('/authenticated')} aria-label="Back to home">←</button>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#b7d334]">Live table</p>
            <h1 className="truncate font-['Space_Grotesk'] text-xl font-bold sm:text-2xl">{tableName}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-lg text-[#c3c8bd] transition hover:border-[#b7d334]/60 hover:text-[#f7f6f2] focus:outline-none focus:ring-2 focus:ring-[#b7d334]/40 disabled:cursor-not-allowed disabled:opacity-40" type="button" onClick={() => { setShareError(null); setIsShareOpen(true) }} disabled={!joinUrl} aria-label="Share table" title="Share table">▦</button>
            <button className="rounded-lg px-1 py-2 text-sm text-[#8e968a] transition hover:text-[#f7f6f2] focus:outline-none focus:ring-2 focus:ring-[#b7d334]/40" type="button" onClick={handleLogout}>Log out</button>
          </div>
        </header>

        <section className="mx-auto mt-8 max-w-5xl sm:mt-12" aria-labelledby="seat-selection-title">
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#8e968a]">10 seats · choose your spot</p>
            <h2 id="seat-selection-title" className="mt-2 font-['Space_Grotesk'] text-3xl font-bold tracking-tight sm:text-4xl">Find your seat</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#a5aaa1]" role="status">
              {selectedSeat ? `Seat ${selectedSeat} is yours. You can move to any other open seat.` : 'Choose an open seat to join the table.'}
            </p>
          </div>

          <div className="poker-table-stage mt-8 sm:mt-12">
            <div className="poker-table-surface" aria-label={`${tableName}, poker table with ten seats`}>
              <div className="table-felt-marking" aria-hidden="true"><span>CHIPSPOCKET</span><small>♠ · ♣ · ♥ · ♦</small></div>
              <div className="table-center-label" aria-hidden="true"><span>TABLE OPEN</span><strong>♠</strong></div>
            </div>

            {seatPositions.map(({ seat, className }) => {
              const player = occupiedSeats.get(seat)
              const isSelected = selectedSeat === seat
              const label = player ? `${player.name}, seat ${seat}` : isSelected ? `Your seat, seat ${seat}` : `Choose seat ${seat}`
              return (
                <button
                  className={`table-seat ${className} ${player ? 'table-seat-occupied' : 'table-seat-open'} ${isSelected ? 'table-seat-selected' : ''}`}
                  key={seat}
                  type="button"
                  onClick={() => { if (!player) setSelectedSeat(isSelected ? null : seat) }}
                  disabled={Boolean(player)}
                  aria-label={label}
                  aria-pressed={isSelected}
                >
                  <span className="table-seat-inner">{player ? getPlayerInitials(player.name) : isSelected ? currentUserInitials : '＋'}</span>
                  <span className="table-seat-number">{seat}</span>
                  {isSelected && <span className="table-seat-you">You</span>}
                </button>
              )
            })}
          </div>

          <div className="mt-8 flex items-center justify-center gap-5 text-xs text-[#8e968a]" aria-label="Seat status legend">
            <span className="flex items-center gap-2"><i className="legend-dot legend-dot-open" aria-hidden="true" />Open</span>
            <span className="flex items-center gap-2"><i className="legend-dot legend-dot-taken" aria-hidden="true" />Occupied</span>
            <span className="flex items-center gap-2"><i className="legend-dot legend-dot-yours" aria-hidden="true" />Your seat</span>
          </div>
        </section>
      </div>

      {isShareOpen && joinUrl && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#080a08]/80 px-4 py-6 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsShareOpen(false) }}>
        <section className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#1a1d19] p-5 text-center shadow-2xl shadow-black/40 sm:p-7" role="dialog" aria-modal="true" aria-labelledby="join-table-title">
          <div className="flex items-start justify-between gap-4 text-left">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#b7d334]">Share table</p>
              <h2 id="join-table-title" className="mt-1 font-['Space_Grotesk'] text-2xl font-bold">Join Table</h2>
            </div>
            <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-xl text-[#c3c8bd] transition hover:border-white/25 focus:outline-none focus:ring-2 focus:ring-[#b7d334]/40" type="button" onClick={() => setIsShareOpen(false)} aria-label="Close join table dialog">×</button>
          </div>
          <p className="mt-3 text-sm leading-6 text-[#a5aaa1]">Scan this QR code to join this table.</p>
          <div className="mx-auto mt-6 w-fit rounded-2xl bg-white p-3 shadow-lg shadow-black/20 sm:p-4">
            <QRCodeSVG value={joinUrl} size={220} level="M" includeMargin bgColor="#ffffff" fgColor="#111311" aria-label="QR code to join this table" />
          </div>
          <p className="mt-5 rounded-lg bg-[#111311] px-3 py-2 text-xs text-[#8e968a]">Join code: <strong className="text-[#d9ed7a]">{joinToken}</strong></p>
        </section>
      </div>}
      {shareError && <p className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2 rounded-xl border border-[#e27350]/30 bg-[#e27350]/10 px-4 py-3 text-center text-sm text-[#ffad93]" role="alert">{shareError}</p>}
    </main>
  )
}