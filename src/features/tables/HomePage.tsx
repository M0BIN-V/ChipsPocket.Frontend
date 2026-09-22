import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { getMe } from '../../api/auth'
import { authStorage } from '../../api/authStorage'
import type { MeResponse } from '../auth/auth.types'
import { QrScanner } from './QrScanner'
import { getTableIdFromJoinUrl } from './tableShare'

export function HomePage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<MeResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showQrScanner, setShowQrScanner] = useState(false)

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

  const handleQrScan = useCallback((value: string): boolean => {
    const tableId = getTableIdFromJoinUrl(value)
    if (!tableId) return false
    setShowQrScanner(false)
    navigate(`/table/${encodeURIComponent(tableId)}`)
    return true
  }, [navigate])

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
            <button className="flex min-h-20 w-full items-center justify-between rounded-2xl border border-white/10 bg-[#1a1d19] px-5 py-4 text-left transition hover:border-white/25 focus:outline-none focus:ring-2 focus:ring-[#b7d334]/40" type="button" onClick={() => setShowQrScanner(true)}><span><span className="block font-['Space_Grotesk'] text-lg font-semibold">Join Table</span><span className="mt-1 block text-sm text-[#8e968a]">Scan a table QR code</span></span><span className="text-xl text-[#b7d334]" aria-hidden="true">▦</span></button>
          </div>
        </section>
        <p className="pb-2 text-center text-xs uppercase tracking-[0.18em] text-[#596157]">{user ? 'Your poker night, organized' : 'ChipsPocket'}</p>
      </div>
      {showQrScanner && <QrScanner onScan={handleQrScan} onClose={() => setShowQrScanner(false)} />}
    </main>
  )
}