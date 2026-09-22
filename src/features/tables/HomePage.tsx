import { AlertTriangle, ChevronRight, Club, LogOut, Plus, QrCode, UserRound, Users, X } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import axios from 'axios'
import { useNavigate, useParams } from 'react-router-dom'
import { getMe } from '../../api/auth'
import { authStorage } from '../../api/authStorage'
import { getTableInfo, joinTableWithToken } from '../../api/tableLobby'
import type { MeResponse } from '../auth/auth.types'
import { QrScanner } from './QrScanner'
import { getJoinTokenFromUrl } from './tableShare'

export function HomePage() {
  const navigate = useNavigate()
  const { token: routeToken } = useParams<{ token?: string }>()
  const [user, setUser] = useState<MeResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showQrScanner, setShowQrScanner] = useState(false)
  const [showJoinDialog, setShowJoinDialog] = useState(Boolean(routeToken))
  const [joinCode, setJoinCode] = useState(routeToken ?? '')
  const [joinError, setJoinError] = useState<string | null>(null)
  const [isJoining, setIsJoining] = useState(false)

  useEffect(() => {
    let isMounted = true
    getMe().then((response) => { if (isMounted) setUser(response) }).catch((error: unknown) => {
      if (!isMounted) return
      if (axios.isAxiosError(error) && error.response?.status === 401) { navigate('/login', { replace: true }); return }
      setErrorMessage('Unable to load your account.')
    })
    return () => { isMounted = false }
  }, [navigate])

  function handleLogout() { authStorage.clear(); navigate('/login', { replace: true }) }

  const submitJoinToken = useCallback(async (token: string) => {
    const normalizedToken = token.trim()
    if (!normalizedToken) {
      setJoinError('Enter a join code.')
      return
    }
    if (!/^[a-z0-9]+$/i.test(normalizedToken)) {
      setJoinError('Join codes can contain only letters and numbers.')
      return
    }
    setJoinError(null)
    setIsJoining(true)
    try {
      const tableId = await joinTableWithToken(normalizedToken)
      const table = await getTableInfo(tableId)
      setShowQrScanner(false)
      setShowJoinDialog(false)
      navigate(`/table/${encodeURIComponent(table.id)}`, { state: { tableId: table.id, tableName: table.name } })
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) setJoinError('This join code is invalid or has expired.')
        else if (error.response?.status === 409) setJoinError('This table lobby is full.')
        else if (!error.response) setJoinError('Unable to connect to the server. Try again.')
        else setJoinError('Unable to join this table. Try again.')
      } else setJoinError('Unable to join this table. Try again.')
    } finally {
      setIsJoining(false)
    }
  }, [navigate])

  const handleQrScan = useCallback((value: string): boolean => {
    const token = getJoinTokenFromUrl(value)
    if (!token) return false
    void submitJoinToken(token)
    return true
  }, [submitJoinToken])

  function openJoinDialog() {
    setJoinError(null)
    setShowJoinDialog(true)
  }

  function closeJoinDialog() {
    if (!isJoining) setShowJoinDialog(false)
  }

  function handleManualJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void submitJoinToken(joinCode)
  }

  return (
    <main className="app-shell">
      <div className="mobile-shell">
        <header className="page-header">
          <div className="flex items-center gap-3" aria-label="ChipsPocket">
            <span className="brand-mark" aria-hidden="true"><Club size={20} strokeWidth={2.2} /></span>
            <span className="brand-title">ChipsPocket</span>
          </div>
          <button className="ghost-button" type="button" onClick={handleLogout}><LogOut size={16} strokeWidth={2.2} />Log out</button>
        </header>

        <section className="home-card" aria-label="Main home screen">
          <div className="welcome-row">
            <div>
              <span className="eyebrow">Ready when you are</span>
              <h1 className="mt-3 font-['Space_Grotesk'] text-4xl font-bold tracking-[-0.06em] text-white">Set up your table.</h1>
            </div>
            <div className="user-chip" aria-label="Current user initial"><UserRound size={18} strokeWidth={2.2} /></div>
          </div>

          <p className="mt-4 text-base leading-7 text-[#a5aaa1]">{user ? `Welcome back, ${user.username}.` : 'Loading your account...'} Bring the chips—we’ll handle the details.</p>

          {errorMessage && <div className="form-error mt-4" role="alert"><span aria-hidden="true"><AlertTriangle size={16} strokeWidth={2.3} /></span><span>{errorMessage}</span></div>}

          <div className="summary-grid" aria-label="Quick app stats">
            <div className="summary-stat">
              <span>Table</span>
              <strong>1-2 min</strong>
            </div>
            <div className="summary-stat">
              <span>Seats</span>
              <strong>10 max</strong>
            </div>
            <div className="summary-stat">
              <span>Share</span>
              <strong>QR code</strong>
            </div>
          </div>

          <div className="action-stack mt-6">
            <button className="action-card primary" type="button" onClick={() => navigate('/create-table')}>
              <span className="action-card-icon" aria-hidden="true"><Plus size={22} strokeWidth={2.4} /></span>
              <span className="action-copy">
                <strong>Create Table</strong>
                <span>Name your table and get started</span>
              </span>
              <span className="action-arrow" aria-hidden="true"><ChevronRight size={18} strokeWidth={2.4} /></span>
            </button>

            <button className="action-card" type="button" onClick={openJoinDialog}>
              <span className="action-card-icon" aria-hidden="true"><Users size={20} strokeWidth={2.3} /></span>
              <span className="action-copy">
                <strong>Join Table</strong>
                <span>Scan a QR code or use a join code</span>
              </span>
              <span className="action-arrow" aria-hidden="true"><ChevronRight size={18} strokeWidth={2.4} /></span>
            </button>
          </div>
        </section>
      </div>

      {showJoinDialog && (
        <div className="sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeJoinDialog() }}>
          <section className="sheet-card" role="dialog" aria-modal="true" aria-labelledby="join-table-title">
            <div className="sheet-header">
              <div>
                <span className="eyebrow">Join a table</span>
                <h2 id="join-table-title">Join Table</h2>
              </div>
              <button className="icon-button" type="button" onClick={closeJoinDialog} aria-label="Close join table dialog"><X size={18} strokeWidth={2.2} /></button>
            </div>

            <button className="primary-button mt-6" type="button" onClick={() => { setJoinError(null); setShowQrScanner(true) }} disabled={isJoining}>
              <QrCode size={18} strokeWidth={2.2} />
              <span>Scan QR code</span>
            </button>

            <div className="form-divider">or</div>

            <form onSubmit={handleManualJoin}>
              <div className="form-field">
                <label htmlFor="join-code">Enter join code</label>
                <input className="form-input tracking-[0.12em]" id="join-code" value={joinCode} onChange={(event) => { setJoinCode(event.target.value); setJoinError(null) }} placeholder="A7K92X" inputMode="text" pattern="[A-Za-z0-9]+" disabled={isJoining} autoComplete="off" />
              </div>

              {joinError && <div className="form-error mt-3" role="alert"><span aria-hidden="true"><AlertTriangle size={16} strokeWidth={2.3} /></span><span>{joinError}</span></div>}

              <button className="secondary-button mt-4" type="submit" disabled={isJoining}>{isJoining ? 'Joining...' : 'Join'}</button>
            </form>
          </section>
        </div>
      )}

      {showQrScanner && <QrScanner onScan={handleQrScan} onClose={() => setShowQrScanner(false)} />}
    </main>
  )
}