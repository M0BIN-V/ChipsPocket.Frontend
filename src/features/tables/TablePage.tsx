import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { AlertTriangle, ArrowLeft, Club, Crown, Diamond, Heart, LoaderCircle, Plus, Share2, Spade, Users, X } from 'lucide-react'
import { getMe } from '../../api/auth'
import { claimTableSeat, getTableInfo, getTableJoinToken, getTableLobbyUsers, releaseTableSeat } from '../../api/tableLobby'
import { useTableRealtime } from '../../realtime/useTableRealtime'
import type { LobbyUserResponse, TableInfoResponse, TableSeatInfo } from './table.types'
import { getPlayerInitials, seatPositions } from './tableSeatLayout'
import { buildTableJoinUrl } from './tableShare'
import { PlayerDetailsModal } from './PlayerDetailsModal'

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
  const [currentUserName, setCurrentUserName] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [tableInfo, setTableInfo] = useState<TableInfoResponse | null>(null)
  const [isTableLoading, setIsTableLoading] = useState(true)
  const [tableError, setTableError] = useState<string | null>(null)
  const [seatActionId, setSeatActionId] = useState<string | null>(null)
  const [seatActionError, setSeatActionError] = useState<string | null>(null)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [joinToken, setJoinToken] = useState<string | null>(tableState?.joinToken ?? null)
  const [isShareLoading, setIsShareLoading] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)
  const [isLobbyOpen, setIsLobbyOpen] = useState(false)
  const [lobbyUsers, setLobbyUsers] = useState<LobbyUserResponse[]>([])
  const [isLobbyLoading, setIsLobbyLoading] = useState(false)
  const [lobbyError, setLobbyError] = useState<string | null>(null)
  const [selectedPlayer, setSelectedPlayer] = useState<{ id?: string; username: string } | null>(null)
  const tableId = routeTableId?.trim() || tableState?.tableId?.trim()
  const tableName = tableInfo?.name ?? tableState?.tableName ?? 'Poker table'
  const joinUrl = joinToken ? buildTableJoinUrl(joinToken) : null
  const tableLoadError = tableError ?? (!tableId ? 'Table information is unavailable.' : null)
  const isManager = Boolean(currentUserId && tableInfo?.managerId && currentUserId === tableInfo.managerId)
  const { status: realtimeStatus, error: realtimeError } = useTableRealtime(tableId, {
    onPlayerJoinedToLobby: (notification) => {
      setLobbyUsers((currentUsers) => currentUsers.some((user) => user.id === notification.userId)
        ? currentUsers
        : [...currentUsers, { id: notification.userId, username: notification.username }])
    },
    onPlayerClaimedSeat: (notification) => {
      setTableInfo((currentTable) => {
        if (!currentTable) return currentTable

        const isNotifiedPlayer = (user: TableSeatInfo['user']) => {
          if (!user) return false
          return user.id ? user.id === notification.userId : user.username === notification.username
        }

        return {
          ...currentTable,
          seats: currentTable.seats.map((seat) => {
            if (seat.id === notification.seatId) return { ...seat, user: { id: notification.userId, username: notification.username } }
            if (isNotifiedPlayer(seat.user)) return { ...seat, user: null }
            return seat
          }),
        }
      })
    },
    onPlayerReleasedSeat: (notification) => {
      setTableInfo((currentTable) => currentTable && {
        ...currentTable,
        seats: currentTable.seats.map((seat) => {
          const isReleasedSeat = seat.id === notification.seatId
          const isReleasedPlayerDuplicate = Boolean(notification.userId && seat.user?.id === notification.userId)
          return isReleasedSeat || isReleasedPlayerDuplicate ? { ...seat, user: null } : seat
        }),
      })
    },
  })

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
      if (isMounted) {
        setCurrentUserId(user.id)
        setCurrentUserName(user.username)
      }
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

  async function handlePlayerSelect(player: { id?: string; username: string }) {
    if (player.id || lobbyUsers.length > 0) {
      setSelectedPlayer(player.id ? player : { ...player, id: lobbyUsers.find((user) => user.username === player.username)?.id })
      return
    }

    try {
      const users = await getTableLobbyUsers(tableId ?? '')
      setLobbyUsers(users)
      setSelectedPlayer({ ...player, id: users.find((user) => user.username === player.username)?.id })
    } catch {
      setSelectedPlayer(player)
    }
  }

  async function handleShareOpen() {
    if (!tableId || isShareLoading) return

    setShareError(null)
    setIsShareLoading(true)
    try {
      const freshToken = await getTableJoinToken(tableId)
      setJoinToken(freshToken)
      setIsShareOpen(true)
    } catch {
      setShareError('Join information is unavailable. Only the table owner can generate a join code.')
    } finally {
      setIsShareLoading(false)
    }
  }

  async function handleSeatClaim(seat: TableSeatInfo) {
    if (!tableId || seat.user || seatActionId) return

    setSeatActionError(null)
    setSeatActionId(seat.id)
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
      setSeatActionId(null)
    }
  }

  async function handleSeatRelease(seat: TableSeatInfo) {
    if (!tableId || !seat.user || seat.user.username !== currentUserName || seatActionId) return

    setSeatActionError(null)
    setSeatActionId(seat.id)
    try {
      await releaseTableSeat(tableId, seat.id)
      setTableInfo((currentTable) => currentTable && {
        ...currentTable,
        seats: currentTable.seats.map((currentSeat) => currentSeat.id === seat.id ? { ...currentSeat, user: null } : currentSeat),
      })
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        setSeatActionError('You can only release your own seat. The table has been refreshed.')
      } else if (axios.isAxiosError(error) && error.response?.status === 404) {
        setSeatActionError('That seat is no longer available. The table has been refreshed.')
      } else {
        setSeatActionError('Unable to release that seat. The table has been refreshed.')
      }
      await loadTableInfo()
    } finally {
      setSeatActionId(null)
    }
  }

  const seatsByOrder = new Map(tableInfo?.seats.map((seat) => [seat.order, seat]) ?? [])
  const currentUserSeat = tableInfo?.seats.find((seat) => seat.user?.username === currentUserName)
  const occupiedSeats = tableInfo?.seats.filter((seat) => seat.user).length ?? 0
  const openSeats = (tableInfo?.seats.length ?? 0) - occupiedSeats

  return (
    <main className="app-shell">
      <div className="table-shell">
        <header className="page-header">
          <button className="icon-button" type="button" onClick={() => navigate('/')} aria-label="Back to lobby"><ArrowLeft size={18} strokeWidth={2.2} /></button>
          <div className="page-titlegroup text-center sm:text-left">
            <h1 className="truncate">{tableName}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="icon-button" type="button" onClick={() => { void handleShareOpen() }} disabled={!tableId || isShareLoading} aria-label="Share table" title="Share table">
              {isShareLoading ? <LoaderCircle size={17} strokeWidth={2.1} className="animate-spin" /> : <Share2 size={17} strokeWidth={2.1} />}
            </button>
            <button className="ghost-button" type="button" onClick={handleLobbyOpen}><Users size={16} strokeWidth={2.2} />Lobby</button>
          </div>
        </header>

        <section className="summary-card mt-5 p-4" aria-live="polite">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#8e968a]">Table status</p>
              <p className="mt-2 text-lg font-semibold text-white">{currentUserSeat ? `Seat ${currentUserSeat.order} is yours` : 'Choose your seat'}</p>
            </div>
            <span className="text-right text-xs text-[#8e968a]" role="status">
              {realtimeStatus === 'connected' ? 'Live updates' : realtimeStatus === 'reconnecting' || realtimeStatus === 'connecting' ? 'Connecting...' : 'Live updates unavailable'}
            </span>
          </div>
          {realtimeError && <p className="mt-3 text-xs text-[#ffad93]" role="alert">{realtimeError}</p>}

          <div className="table-summary mt-4">
            <span className="table-pill"><span className="pill-dot" /> {occupiedSeats}/{tableInfo?.seats.length ?? 10} occupied</span>
            <span className="table-pill">{openSeats} open</span>
            <span className="table-pill">{tableInfo ? `${tableInfo.seats.length} seats` : 'loading'}</span>
          </div>
        </section>

        <section className="table-scene-wrap" aria-labelledby="seat-selection-title">
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#8e968a]">10 seats · choose your spot</p>
            <h2 id="seat-selection-title" className="mt-2 font-['Space_Grotesk'] text-3xl font-bold tracking-[-0.06em] text-white">Find your seat</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#a5aaa1]" role="status">
              {currentUserSeat ? `Seat ${currentUserSeat.order} is yours. You can move to any other open seat.` : 'Choose an open seat to join the table.'}
            </p>
          </div>

          {isTableLoading && !tableLoadError && <p className="mt-10 text-center text-sm text-[#a5aaa1]" role="status">Loading table seats...</p>}
          {tableLoadError && (
            <div className="mx-auto mt-8 max-w-md form-error" role="alert">
              <span aria-hidden="true"><AlertTriangle size={16} strokeWidth={2.3} /></span>
              <div>
                <p>{tableLoadError}</p>
                <button className="mt-3 ghost-button" type="button" onClick={() => { void loadTableInfo() }}>Try again</button>
              </div>
            </div>
          )}

          {!isTableLoading && !tableLoadError && tableInfo && (
            <>
              <div className="poker-table-stage mt-8">
                <div className="poker-table-surface" aria-label={`${tableName}, poker table with ${tableInfo.seats.length} seats`}>
                  <div className="table-felt-marking" aria-hidden="true"><span>CHIPSPOCKET</span><small className="table-suit-row"><Spade size={12} strokeWidth={2.2} /><Club size={12} strokeWidth={2.2} /><Heart size={12} strokeWidth={2.2} /><Diamond size={12} strokeWidth={2.2} /></small></div>
                  <div className="table-center-label" aria-hidden="true"><span>TABLE OPEN</span><strong><Club size={28} strokeWidth={2.2} /></strong></div>
                </div>

                {seatPositions.map(({ seat, className }) => {
                  const seatInfo = seatsByOrder.get(seat)
                  const username = seatInfo?.user?.username
                  const isCurrentUser = Boolean(currentUserName && username === currentUserName)
                  const isActionInProgress = seatInfo?.id === seatActionId
                  const label = isCurrentUser ? `Release your seat ${seat}` : username ? `${username}, seat ${seat}` : `Choose seat ${seat}`
                  return (
                    <button
                      className={`table-seat ${className} ${username ? 'table-seat-occupied' : 'table-seat-open'} ${isCurrentUser ? 'table-seat-selected' : ''}`}
                      key={seatInfo?.id ?? seat}
                      type="button"
                      onClick={() => { if (!seatInfo) return; if (isCurrentUser) void handleSeatRelease(seatInfo); else if (username) void handlePlayerSelect({ id: seatInfo.user?.id, username }); else void handleSeatClaim(seatInfo) }}
                      disabled={!seatInfo || Boolean(seatActionId)}
                      aria-label={isActionInProgress ? `${isCurrentUser ? 'Releasing' : 'Claiming'} seat ${seat}` : label}
                      aria-pressed={isCurrentUser}
                    >
                      <span className="table-seat-inner">{isActionInProgress ? <LoaderCircle size={18} strokeWidth={2.5} className="animate-spin" /> : username ? getPlayerInitials(username) : <Plus size={20} strokeWidth={2.5} />}</span>
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
            </>
          )}
        </section>
      </div>

      {isShareOpen && joinUrl && (
        <div className="sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsShareOpen(false) }}>
          <section className="sheet-card" role="dialog" aria-modal="true" aria-labelledby="join-table-title">
            <div className="sheet-header">
              <div>
                <span className="eyebrow">Share table</span>
                <h2 id="join-table-title">Join Table</h2>
              </div>
              <button className="icon-button" type="button" onClick={() => setIsShareOpen(false)} aria-label="Close join table dialog"><X size={18} strokeWidth={2.2} /></button>
            </div>

            <p className="mt-3 text-sm leading-6 text-[#a5aaa1]">Scan this QR code or share the join code with your friends.</p>
            <div className="qr-wrapper">
              <QRCodeSVG value={joinUrl} size={220} level="M" includeMargin bgColor="#ffffff" fgColor="#111311" aria-label="QR code to join this table" />
            </div>
            <div className="join-code-surface">Join code: <strong>{joinToken}</strong></div>
          </section>
        </div>
      )}

      {isLobbyOpen && (
        <div className="sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsLobbyOpen(false) }}>
          <section className="sheet-card" role="dialog" aria-modal="true" aria-labelledby="lobby-users-title">
            <div className="sheet-header">
              <div>
                <span className="eyebrow">Current players</span>
                <h2 id="lobby-users-title">Lobby Users</h2>
              </div>
              <button className="icon-button" type="button" onClick={() => setIsLobbyOpen(false)} aria-label="Close lobby users dialog"><X size={18} strokeWidth={2.2} /></button>
            </div>

            <div className="mt-6" aria-live="polite">
              {isLobbyLoading && <p className="py-5 text-center text-sm text-[#a5aaa1]">Loading lobby users...</p>}
              {!isLobbyLoading && lobbyError && <div className="form-error" role="alert"><span aria-hidden="true"><AlertTriangle size={16} strokeWidth={2.3} /></span><span>{lobbyError}</span></div>}
              {!isLobbyLoading && !lobbyError && lobbyUsers.length === 0 && <p className="py-5 text-center text-sm text-[#a5aaa1]">No users are currently in the lobby.</p>}
              {!isLobbyLoading && !lobbyError && lobbyUsers.length > 0 && (
                <ul className="space-y-2">
                  {lobbyUsers.map((user) => (
                    <li key={user.id}>
                      <button className="flex w-full items-center justify-between gap-3 rounded-2xl bg-[#111311] px-3 py-3 text-left transition hover:bg-[#1a2019]" type="button" onClick={() => { void handlePlayerSelect(user) }}>
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#b7d334]/15 text-sm font-semibold text-[#d9ed7a]" aria-hidden="true">{getPlayerInitials(user.username)}</span>
                          <span className="truncate text-sm font-medium">{user.username}</span>
                        </span>
                        {user.id === tableInfo?.managerId && <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#b7d334]/35 bg-[#b7d334]/10 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-[#d9ed7a]"><Crown size={12} strokeWidth={2.3} />Manager</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      )}

      {seatActionError && <p className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2 rounded-xl border border-[#e27350]/30 bg-[#e27350]/10 px-4 py-3 text-center text-sm text-[#ffad93]" role="alert">{seatActionError}</p>}
      {shareError && <p className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2 rounded-xl border border-[#e27350]/30 bg-[#e27350]/10 px-4 py-3 text-center text-sm text-[#ffad93]" role="alert">{shareError}</p>}
      {selectedPlayer && tableId && <PlayerDetailsModal key={selectedPlayer.id ?? selectedPlayer.username} tableId={tableId} player={{ ...selectedPlayer, id: selectedPlayer.id ?? (selectedPlayer.username === currentUserName ? currentUserId ?? undefined : undefined) }} isManager={isManager} onClose={() => setSelectedPlayer(null)} />}
    </main>
  )
}