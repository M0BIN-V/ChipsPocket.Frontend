import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { getMe } from '../../api/auth'
import { authStorage } from '../../api/authStorage'
import type { MeResponse } from './auth.types'

export function AuthenticatedPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<MeResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

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

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#111311] px-5 py-10 text-[#f7f6f2]">
      <section className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#1a1d19] p-7 text-center shadow-2xl shadow-black/40 sm:p-9">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-[#b7d334]">Pocket Chips</p><h1 className="font-['Space_Grotesk'] text-3xl font-bold tracking-tight">Logged in successfully</h1>
        {user ? <p className="mt-5 text-[#c3c8bd]">Username: <span className="font-semibold text-[#f7f6f2]">{user.username}</span>{user.email && <><br />Email: {user.email}</>}</p> : <p className="mt-5 text-sm text-[#a5aaa1]">Loading your account...</p>}
        {errorMessage && <p className="mt-5 text-sm text-[#ffad93]" role="alert">{errorMessage}</p>}
        <button className="mt-8 h-12 w-full rounded-xl border border-white/15 px-4 font-semibold text-[#f7f6f2] transition hover:border-[#b7d334] hover:text-[#d9ed7a] focus:outline-none focus:ring-2 focus:ring-[#b7d334]/40" type="button" onClick={handleLogout}>Log out</button>
      </section>
    </main>
  )
}
