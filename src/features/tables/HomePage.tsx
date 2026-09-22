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
    <main className="min-h-screen bg-[#111311] px-5 py-6 text-[#f7f6f2] sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-lg flex-col">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3" aria-label="ChipsPocket"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#b7d334] text-xl font-bold text-[#151712]">♠</span><span className="font-['Space_Grotesk'] text-lg font-semibold tracking-tight">ChipsPocket</span></div>
          <button className="rounded-lg px-2 py-2 text-sm text-[#8e968a] transition hover:text-[#f7f6f2] focus:outline-none focus:ring-2 focus:ring-[#b7d334]/40" type="button" onClick={handleLogout}>Log out</button>
        </header>
        <section className="flex flex-1 flex-col justify-center py-12">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#b7d334]">Ready when you are</p>
          <h1 className="mt-3 font-['Space_Grotesk'] text-4xl font-bold tracking-tight sm:text-5xl">Set up your table.</h1>
          <p className="mt-4 max-w-md text-base leading-7 text-[#a5aaa1]">{user ? `Welcome back, ${user.username}.` : 'Loading your account...'} Bring the chips, we’ll handle the details.</p>
          {errorMessage && <p className="mt-4 text-sm text-[#ffad93]" role="alert">{errorMessage}</p>}
          <div className="mt-10 space-y-3">
            <button className="group flex min-h-24 w-full items-center justify-between rounded-2xl bg-[#b7d334] px-5 py-5 text-left text-[#151712] shadow-xl shadow-[#b7d334]/10 transition hover:bg-[#c9e34e] focus:outline-none focus:ring-2 focus:ring-[#d9ed7a] focus:ring-offset-2 focus:ring-offset-[#111311]" type="button" onClick={() => navigate('/create-table')}><span><span className="block font-['Space_Grotesk'] text-xl font-bold">Create Table</span><span className="mt-1 block text-sm text-[#3c461c]">Name your table and get started</span></span><span className="text-2xl transition-transform group-hover:translate-x-1" aria-hidden="true">→</span></button>
            <button className="flex min-h-20 w-full items-center justify-between rounded-2xl border border-white/10 bg-[#1a1d19] px-5 py-4 text-left transition hover:border-white/25 focus:outline-none focus:ring-2 focus:ring-[#b7d334]/40" type="button" onClick={openJoinDialog}><span><span className="block font-['Space_Grotesk'] text-lg font-semibold">Join Table</span><span className="mt-1 block text-sm text-[#8e968a]">Scan a QR code or enter a join code</span></span><span className="text-xl text-[#b7d334]" aria-hidden="true">▦</span></button>
          </div>
        </section>
        <p className="pb-2 text-center text-xs uppercase tracking-[0.18em] text-[#596157]">{user ? 'Your poker night, organized' : 'ChipsPocket'}</p>
      </div>
      {showJoinDialog && <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#080a08]/80 px-4 py-6 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeJoinDialog() }}>
        <section className="w-full max-w-md rounded-3xl border border-white/10 bg-[#1a1d19] p-5 shadow-2xl shadow-black/40 sm:p-7" role="dialog" aria-modal="true" aria-labelledby="join-table-title">
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-medium uppercase tracking-[0.18em] text-[#b7d334]">Join a table</p><h2 id="join-table-title" className="mt-1 font-['Space_Grotesk'] text-2xl font-bold">Join Table</h2></div><button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-xl text-[#c3c8bd] transition hover:border-white/25 focus:outline-none focus:ring-2 focus:ring-[#b7d334]/40" type="button" onClick={closeJoinDialog} aria-label="Close join table dialog">×</button></div>
          <button className="mt-6 flex w-full items-center justify-between rounded-xl bg-[#b7d334] px-4 py-3.5 text-left font-semibold text-[#151712] transition hover:bg-[#c9e34e] focus:outline-none focus:ring-2 focus:ring-[#d9ed7a] disabled:cursor-not-allowed disabled:opacity-60" type="button" onClick={() => { setJoinError(null); setShowQrScanner(true) }} disabled={isJoining}><span>Scan QR Code</span><span aria-hidden="true">▦</span></button>
          <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-[#596157]"><span className="h-px flex-1 bg-white/10" />or<span className="h-px flex-1 bg-white/10" /></div>
          <form onSubmit={handleManualJoin}><label className="block text-sm font-medium text-[#d8dbd3]" htmlFor="join-code">Enter join code</label><input className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#111311] px-4 text-base tracking-[0.12em] text-[#f7f6f2] outline-none transition placeholder:text-[#6f756c] focus:border-[#b7d334] focus:ring-2 focus:ring-[#b7d334]/20" id="join-code" value={joinCode} onChange={(event) => { setJoinCode(event.target.value); setJoinError(null) }} placeholder="A7K92X" inputMode="text" pattern="[A-Za-z0-9]+" disabled={isJoining} autoComplete="off" />{joinError && <p className="mt-2 text-sm text-[#ffad93]" role="alert">{joinError}</p>}<button className="mt-4 w-full rounded-xl border border-white/10 px-4 py-3 font-semibold text-[#d8dbd3] transition hover:border-white/25 focus:outline-none focus:ring-2 focus:ring-[#b7d334]/40 disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={isJoining}>{isJoining ? 'Joining...' : 'Join'}</button></form>
        </section>
      </div>}
      {showQrScanner && <QrScanner onScan={handleQrScan} onClose={() => setShowQrScanner(false)} />}
    </main>
  )
}