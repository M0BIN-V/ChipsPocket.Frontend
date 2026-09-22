import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { getMe } from '../../api/auth'
import { authStorage } from '../../api/authStorage'
import { claimTableSeat, getTableInfo, getTableJoinToken, getTableLobbyUsers } from '../../api/tableLobby'
import type { LobbyUserResponse, TableInfoResponse, TableSeatInfo } from './table.types'
import { getPlayerInitials, seatPositions } from './tableSeatLayout'
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
  const [tableInfo, setTableInfo] = useState<TableInfoResponse | null>(null)
  const [isTableLoading, setIsTableLoading] = useState(true)
  const [tableError, setTableError] = useState<string | null>(null)
  const [claimingSeatId, setClaimingSeatId] = useState<string | null>(null)
  const [seatActionError, setSeatActionError] = useState<string | null>(null)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [joinToken, setJoinToken] = useState<string | null>(tableState?.joinToken ?? null)
  const [shareError, setShareError] = useState<string | null>(null)
  const [isLobbyOpen, setIsLobbyOpen] = useState(false)
  const [lobbyUsers, setLobbyUsers] = useState<LobbyUserResponse[]>([])
  const [isLobbyLoading, setIsLobbyLoading] = useState(false)
  const [lobbyError, setLobbyError] = useState<string | null>(null)
  const tableId = routeTableId?.trim() || tableState?.tableId?.trim()
  const tableName = tableInfo?.name ?? tableState?.tableName ?? 'Poker table'
  const joinUrl = joinToken ? buildTableJoinUrl(joinToken) : null
  const tableLoadError = tableError ?? (!tableId ? 'Table information is unavailable.' : null)

  const loadTableInfo = useCallback(async () => {
    if (!tableId) {
      setIsTableLoading(false)
      setTableError('Table information is unavailable.')
      return null
    }

    setIsTableLoading(true)
    setTableError(null)
    try {
      const table = await getTableInfo(tableId)
      setTableInfo(table)
      return table
    } catch {
      setTableError('Unable to load the table seats. Please try again.')
      return null
    } finally {
      setIsTableLoading(false)
    }
  }, [tableId])

  useEffect(() => {
    if (!tableId) return

    let isMounted = true
    getTableInfo(tableId).then((table) => {
      if (!isMounted) return
      setTableInfo(table)
      setTableError(null)
    }).catch(() => {
      if (isMounted) setTableError('Unable to load the table seats. Please try again.')
    }).finally(() => {
      if (isMounted) setIsTableLoading(false)
    })
    return () => { isMounted = false }
  }, [tableId])

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
    if (!isShareOpen && !isLobbyOpen) return
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setIsShareOpen(false)
      setIsLobbyOpen(false)
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isShareOpen, isLobbyOpen])

  function handleLobbyOpen() {
    if (!tableId) {
      setLobbyError('Lobby information is unavailable for this table.')
      setIsLobbyOpen(true)
      return
    }

    setIsLobbyOpen(true)
    setIsLobbyLoading(true)
    setLobbyError(null)
    getTableLobbyUsers(tableId).then((users) => {
      setLobbyUsers(users)
    }).catch(() => {
      setLobbyError('We could not load the lobby users. Please try again.')
    }).finally(() => {
      setIsLobbyLoading(false)
    })
  }

  async function handleSeatClaim(seat: TableSeatInfo) {
    if (!tableId || seat.user || claimingSeatId) return

    setSeatActionError(null)
    setClaimingSeatId(seat.id)
    try {
      await claimTableSeat(tableId, seat.id)
      await loadTableInfo()
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        setSeatActionError('That seat was just taken. The table has been refreshed.')
        await loadTableInfo()
      } else {
        setSeatActionError('Unable to claim that seat. Please try again.')
      }
    } finally {
      setClaimingSeatId(null)
    }
  }

  function handleLogout() {
    authStorage.clear()
    navigate('/login', { replace: true })
  }

  const seatsByOrder = new Map(tableInfo?.seats.map((seat) => [seat.order, seat]) ?? [])
  const currentUserSeat = tableInfo?.seats.find((seat) => seat.user?.username === currentUserName)

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
            <button className="rounded-lg border border-white/10 px-3 py-2 text-sm text-[#c3c8bd] transition hover:border-[#b7d334]/60 hover:text-[#f7f6f2] focus:outline-none focus:ring-2 focus:ring-[#b7d334]/40" type="button" onClick={handleLobbyOpen}>Lobby Users</button>
            <button className="rounded-lg px-1 py-2 text-sm text-[#8e968a] transition hover:text-[#f7f6f2] focus:outline-none focus:ring-2 focus:ring-[#b7d334]/40" type="button" onClick={handleLogout}>Log out</button>
          </div>
        </header>

        <section className="mx-auto mt-8 max-w-5xl sm:mt-12" aria-labelledby="seat-selection-title">
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#8e968a]">10 seats · choose your spot</p>
            <h2 id="seat-selection-title" className="mt-2 font-['Space_Grotesk'] text-3xl font-bold tracking-tight sm:text-4xl">Find your seat</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#a5aaa1]" role="status">
              {currentUserSeat ? `Seat ${currentUserSeat.order} is yours. You can move to any other open seat.` : 'Choose an open seat to join the table.'}
            </p>
          </div>

          {isTableLoading && !tableLoadError && <p className="mt-12 text-center text-sm text-[#a5aaa1]" role="status">Loading table seats...</p>}
          {tableLoadError && <div className="mx-auto mt-8 max-w-md rounded-xl border border-[#e27350]/30 bg-[#e27350]/10 px-4 py-3 text-center text-sm text-[#ffad93]" role="alert"><p>{tableLoadError}</p><button className="mt-3 rounded-lg border border-[#ffad93]/40 px-3 py-2 text-sm text-[#ffad93] transition hover:border-[#ffad93] focus:outline-none focus:ring-2 focus:ring-[#b7d334]/40" type="button" onClick={() => { void loadTableInfo() }}>Try again</button></div>}
          {!isTableLoading && !tableLoadError && tableInfo && <>
            <div className="poker-table-stage mt-8 sm:mt-12">
              <div className="poker-table-surface" aria-label={`${tableName}, poker table with ${tableInfo.seats.length} seats`}>
                <div className="table-felt-marking" aria-hidden="true"><span>CHIPSPOCKET</span><small>♠ · ♣ · ♥ · ♦</small></div>
                <div className="table-center-label" aria-hidden="true"><span>TABLE OPEN</span><strong>♠</strong></div>
              </div>

              {seatPositions.map(({ seat, className }) => {
                const seatInfo = seatsByOrder.get(seat)
                const username = seatInfo?.user?.username
                const isCurrentUser = username === currentUserName
                const isClaiming = seatInfo?.id === claimingSeatId
                const label = username ? `${username}, seat ${seat}` : `Choose seat ${seat}`
                return (
                  <button
                    className={`table-seat ${className} ${username ? 'table-seat-occupied' : 'table-seat-open'} ${isCurrentUser ? 'table-seat-selected' : ''}`}
                    key={seatInfo?.id ?? seat}
                    type="button"
                    onClick={() => { if (seatInfo && !seatInfo.user) void handleSeatClaim(seatInfo) }}
                    disabled={!seatInfo || Boolean(username) || Boolean(claimingSeatId)}
                    aria-label={isClaiming ? `Claiming seat ${seat}` : label}
                    aria-pressed={isCurrentUser}
                  >
                    <span className="table-seat-inner">{isClaiming ? '…' : username ? getPlayerInitials(username) : '＋'}</span>
                    <span className="table-seat-number">{seat}</span>
                    {isCurrentUser && <span className="table-seat-you">You</span>}
                  </button>
                )
              })}
            </div>

            <div className="mt-8 flex items-center justify-center gap-5 text-xs text-[#8e968a]" aria-label="Seat status legend">
              <span className="flex items-center gap-2"><i className="legend-dot legend-dot-open" aria-hidden="true" />Open</span>
              <span className="flex items-center gap-2"><i className="legend-dot legend-dot-taken" aria-hidden="true" />Occupied</span>
              <span className="flex items-center gap-2"><i className="legend-dot legend-dot-yours" aria-hidden="true" />Your seat</span>
            </div>
          </>}
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
      {isLobbyOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#080a08]/80 px-4 py-6 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsLobbyOpen(false) }}>
        <section className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#1a1d19] p-5 text-[#f7f6f2] shadow-2xl shadow-black/40 sm:p-7" role="dialog" aria-modal="true" aria-labelledby="lobby-users-title">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#b7d334]">Current players</p>
              <h2 id="lobby-users-title" className="mt-1 font-['Space_Grotesk'] text-2xl font-bold">Lobby Users</h2>
            </div>
            <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-xl text-[#c3c8bd] transition hover:border-white/25 focus:outline-none focus:ring-2 focus:ring-[#b7d334]/40" type="button" onClick={() => setIsLobbyOpen(false)} aria-label="Close lobby users dialog">×</button>
          </div>
          <div className="mt-6" aria-live="polite">
            {isLobbyLoading && <p className="py-5 text-center text-sm text-[#a5aaa1]">Loading lobby users...</p>}
            {!isLobbyLoading && lobbyError && <div className="rounded-xl border border-[#e27350]/30 bg-[#e27350]/10 px-4 py-3 text-sm text-[#ffad93]" role="alert">{lobbyError}</div>}
            {!isLobbyLoading && !lobbyError && lobbyUsers.length === 0 && <p className="py-5 text-center text-sm text-[#a5aaa1]">No users are currently in the lobby.</p>}
            {!isLobbyLoading && !lobbyError && lobbyUsers.length > 0 && <ul className="space-y-2">
              {lobbyUsers.map((user) => <li className="flex items-center gap-3 rounded-xl bg-[#111311] px-3 py-3" key={user.id}>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#b7d334]/15 text-sm font-semibold text-[#d9ed7a]" aria-hidden="true">{getPlayerInitials(user.username)}</span>
                <span className="text-sm font-medium">{user.username}</span>
              </li>)}
            </ul>}
          </div>
        </section>
      </div>}
      {seatActionError && <p className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2 rounded-xl border border-[#e27350]/30 bg-[#e27350]/10 px-4 py-3 text-center text-sm text-[#ffad93]" role="alert">{seatActionError}</p>}
      {shareError && <p className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2 rounded-xl border border-[#e27350]/30 bg-[#e27350]/10 px-4 py-3 text-center text-sm text-[#ffad93]" role="alert">{shareError}</p>}
    </main>
  )
}