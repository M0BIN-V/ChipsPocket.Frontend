import { AlertTriangle, ArrowLeft, ChevronRight, Hash, LoaderCircle, QrCode, Plus, UserRound, Users } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import axios from 'axios'
import { useNavigate, useParams } from 'react-router-dom'
import { getMe } from '../../api/auth'
import { getMyTables } from '../../api/tables'
import { joinTableWithToken } from '../../api/tableLobby'
import { QrScanner } from './QrScanner'
import type { GetMyTablesResponse } from './table.types'

function formatRelativeTime(value: string): string {
  const now = Date.now()
  const timestamp = new Date(value).getTime()
  const diffMinutes = Math.max(0, Math.round((now - timestamp) / 60000))

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`

  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`

  const diffDays = Math.round(diffHours / 24)
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`

  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function JoinTablePage() {
  const navigate = useNavigate()
  const { token: routeToken } = useParams<{ token?: string }>()
  const [joinCode, setJoinCode] = useState(routeToken ?? '')
  const [joinError, setJoinError] = useState<string | null>(null)
  const [isJoining, setIsJoining] = useState(false)
  const [showQrScanner, setShowQrScanner] = useState(false)
  const [myTables, setMyTables] = useState<GetMyTablesResponse[]>([])
  const [isLoadingTables, setIsLoadingTables] = useState(true)
  const [tablesError, setTablesError] = useState<string | null>(null)

  const loadMyTables = useCallback(async () => {
    setIsLoadingTables(true)
    setTablesError(null)

    try {
      const tables = await getMyTables()
      setMyTables(tables)
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        navigate('/login', { replace: true })
        return
      }
      setTablesError('We could not load your tables right now. Try again in a moment.')
    } finally {
      setIsLoadingTables(false)
    }
  }, [navigate])

  useEffect(() => {
    let isMounted = true
    getMe().catch(() => {
      if (isMounted) navigate('/login', { replace: true })
    })
    void loadMyTables()
    return () => { isMounted = false }
  }, [loadMyTables, navigate])

  const submitJoinToken = useCallback(async (token: string) => {
    const normalizedToken = token.trim()
    if (!normalizedToken) {
      setJoinError('Enter a table code first.')
      return
    }

    if (!/^[a-z0-9]+$/i.test(normalizedToken)) {
      setJoinError('Table codes can contain only letters and numbers.')
      return
    }

    setJoinError(null)
    setIsJoining(true)

    try {
      const tableId = await joinTableWithToken(normalizedToken)
      await loadMyTables()
      navigate(`/tables/${encodeURIComponent(tableId)}`)
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) setJoinError('This code is invalid or has expired.')
        else if (error.response?.status === 409) setJoinError('This table lobby is full.')
        else if (!error.response) setJoinError('Unable to reach the server. Please try again.')
        else setJoinError('We could not join that table. Try again.')
      } else {
        setJoinError('We could not join that table. Try again.')
      }
    } finally {
      setIsJoining(false)
    }
  }, [loadMyTables, navigate])

  const handleQrScan = useCallback((value: string): boolean => {
    const normalizedValue = value.trim()
    if (!normalizedValue) {
      setJoinError('Invalid table QR code. This QR code isn’t a valid ChipsPocket table code.')
      return false
    }

    if (/^https?:\/\//i.test(normalizedValue) || normalizedValue.includes('://')) {
      setJoinError('This is a ChipsPocket app QR code. Please scan a table QR code to join a table.')
      return false
    }

    if (!/^[a-z0-9]+$/i.test(normalizedValue)) {
      setJoinError('Invalid table QR code. This QR code isn’t a valid ChipsPocket table code.')
      return false
    }

    setJoinError(null)
    setShowQrScanner(false)
    void submitJoinToken(normalizedValue)
    return true
  }, [submitJoinToken])

  useEffect(() => {
    if (!routeToken) return
    void submitJoinToken(routeToken)
  }, [routeToken, submitJoinToken])

  function handleManualJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void submitJoinToken(joinCode)
  }

  return (
    <main className="app-shell">
      <div className="mobile-shell join-page-shell">
        <header className="page-header">
          <button className="icon-button" type="button" onClick={() => navigate('/')} aria-label="Back to lobby"><ArrowLeft size={18} strokeWidth={2.2} /></button>
          <div className="page-titlegroup">
            <span className="eyebrow">Join a table</span>
            <h1>Join Table</h1>
          </div>
        </header>

        <section className="form-card" aria-label="Join table form">
          <form onSubmit={handleManualJoin} noValidate>
            <div className="form-field">
              <label htmlFor="table-code">Table code</label>
              <div className="input-with-icon">
                <Hash size={18} strokeWidth={2.1} />
                <input
                  className="form-input uppercase"
                  id="table-code"
                  value={joinCode}
                  onChange={(event) => {
                    setJoinCode(event.target.value)
                    setJoinError(null)
                  }}
                  placeholder="A7K92X"
                  inputMode="text"
                  autoComplete="off"
                  disabled={isJoining}
                />
              </div>
            </div>

            {joinError && (
              <div className="form-error mt-3" role="alert">
                <span aria-hidden="true"><AlertTriangle size={16} strokeWidth={2.3} /></span>
                <span>{joinError}</span>
              </div>
            )}

            <button className="primary-button mt-4" type="submit" disabled={isJoining}>
              {isJoining ? <LoaderCircle size={18} strokeWidth={2.2} className="animate-spin" /> : <Plus size={18} strokeWidth={2.3} />}
              <span>{isJoining ? 'Joining...' : 'Join Table'}</span>
            </button>
          </form>

          <div className="form-divider">or</div>

          <button className="secondary-button" type="button" onClick={() => setShowQrScanner(true)} disabled={isJoining}>
            <QrCode size={18} strokeWidth={2.2} />
            <span>Scan QR Code</span>
          </button>
          <p className="scan-hint">Scan a table’s QR code to join instantly.</p>
        </section>

        <section className="summary-card tables-panel" aria-label="Available tables">
          <div className="section-header">
            <div>
              <span className="eyebrow">Your tables</span>
              <h2>Your Tables</h2>
            </div>
            <button className="ghost-button small-button" type="button" onClick={() => { void loadMyTables() }} disabled={isLoadingTables}>
              {isLoadingTables ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {isLoadingTables ? (
            <div className="table-list" aria-live="polite">
              {[1, 2, 3].map((item) => (
                <div key={item} className="table-card skeleton-card" aria-hidden="true">
                  <span className="skeleton-line skeleton-line-lg" />
                  <span className="skeleton-line skeleton-line-sm" />
                </div>
              ))}
            </div>
          ) : tablesError ? (
            <div className="empty-state compact-state" role="alert">
              <div className="empty-state-icon empty-state-danger">
                <AlertTriangle size={22} strokeWidth={2.2} />
              </div>
              <p>{tablesError}</p>
              <button className="secondary-button" type="button" onClick={() => { void loadMyTables() }}>Try again</button>
            </div>
          ) : myTables.length === 0 ? (
            <div className="empty-state compact-state">
              <div className="empty-state-icon">
                <Users size={24} strokeWidth={2.1} />
              </div>
              <h3>No tables yet</h3>
              <p>Join a table with a code or create a new one to get started.</p>
              <button className="primary-button" type="button" onClick={() => navigate('/create-table')}>
                <Plus size={18} strokeWidth={2.3} />
                <span>Create Table</span>
              </button>
            </div>
          ) : (
            <div className="table-list" aria-live="polite">
              {myTables.map((table) => (
                <button key={table.tableId} className="table-card" type="button" onClick={() => navigate(`/tables/${encodeURIComponent(table.tableId)}`)}>
                  <span className="table-card-icon" aria-hidden="true"><UserRound size={18} strokeWidth={2.2} /></span>
                  <span className="table-card-copy">
                    <strong>{table.tableName}</strong>
                    <span>{formatRelativeTime(table.createdAt)}</span>
                  </span>
                  <span className="table-card-arrow" aria-hidden="true"><ChevronRight size={18} strokeWidth={2.3} /></span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {showQrScanner && (
        <QrScanner
          title="Scan Table QR"
          description="Point your camera at a table QR code."
          invalidMessage="Invalid table QR code. This QR code isn’t a valid ChipsPocket table code."
          onScan={handleQrScan}
          onClose={() => setShowQrScanner(false)}
        />
      )}
    </main>
  )
}
