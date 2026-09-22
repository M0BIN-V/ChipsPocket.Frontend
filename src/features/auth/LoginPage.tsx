import { useState, type FormEvent } from 'react'
import axios from 'axios'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { login } from '../../api/auth'
import { authStorage } from '../../api/authStorage'

function getLoginError(error: unknown): string {
    if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) return 'Invalid username or password.'
        if (!error.response) return 'Unable to connect to the server.'
    }
    return 'Something went wrong. Please try again.'
}

export function LoginPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const successMessage = (location.state as { successMessage?: string } | null)?.successMessage

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const trimmedUsername = username.trim()
        if (!trimmedUsername || !password) {
            setErrorMessage(!trimmedUsername ? 'Enter your username.' : 'Enter your password.')
            return
        }
        setErrorMessage(null)
        setIsSubmitting(true)
        try {
            const response = await login({ username: trimmedUsername, password })
            authStorage.set(response.accessToken, response.expiresAt)
            navigate('/authenticated', { replace: true })
        } catch (error: unknown) {
            setErrorMessage(getLoginError(error))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#111311] px-5 py-10 text-[#f7f6f2]">
            <div className="pointer-events-none absolute -left-28 -top-28 h-72 w-72 rounded-full bg-[#b7d334]/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-36 -right-28 h-96 w-96 rounded-full bg-[#dd6b3d]/10 blur-3xl" />
            <section className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-[#1a1d19]/95 p-7 shadow-2xl shadow-black/40 sm:p-9">
                <div className="mb-8">
                    <div className="mb-7 flex items-center gap-3" aria-label="Pocket Chips"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#b7d334] text-xl font-bold text-[#151712] shadow-lg shadow-[#b7d334]/10">♠</span><span className="font-['Space_Grotesk'] text-lg font-semibold tracking-tight">Pocket Chips</span></div>
                    <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-[#b7d334]">Welcome back</p>
                    <h1 className="font-['Space_Grotesk'] text-3xl font-bold tracking-tight">Sign in to your table</h1>
                    <p className="mt-3 text-sm leading-6 text-[#a5aaa1]">Keep your game close, wherever the table takes you.</p>
                </div>
                <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                    <div><label className="mb-2 block text-sm font-medium text-[#d8dbd3]" htmlFor="username">Username</label><input className="h-12 w-full rounded-xl border border-white/10 bg-[#111311] px-4 text-base text-[#f7f6f2] outline-none transition placeholder:text-[#6f756c] focus:border-[#b7d334] focus:ring-2 focus:ring-[#b7d334]/20" id="username" name="username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Enter your username" disabled={isSubmitting} /></div>
                    <div><label className="mb-2 block text-sm font-medium text-[#d8dbd3]" htmlFor="password">Password</label><input className="h-12 w-full rounded-xl border border-white/10 bg-[#111311] px-4 text-base text-[#f7f6f2] outline-none transition placeholder:text-[#6f756c] focus:border-[#b7d334] focus:ring-2 focus:ring-[#b7d334]/20" id="password" name="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" disabled={isSubmitting} /></div>
                    {errorMessage && <p className="rounded-xl border border-[#e27350]/30 bg-[#e27350]/10 px-4 py-3 text-sm text-[#ffad93]" role="alert">{errorMessage}</p>}
                    {successMessage && <p className="rounded-xl border border-[#b7d334]/30 bg-[#b7d334]/10 px-4 py-3 text-sm text-[#d9ed7a]" role="status">{successMessage}</p>}
                    <button className="h-12 w-full rounded-xl bg-[#b7d334] px-4 font-semibold text-[#151712] transition hover:bg-[#c9e34e] focus:outline-none focus:ring-2 focus:ring-[#d9ed7a] focus:ring-offset-2 focus:ring-offset-[#1a1d19] disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Signing in...' : 'Sign in'}</button>
                </form>
                <p className="mt-6 text-center text-sm text-[#a5aaa1]">Don't have an account? <Link className="font-semibold text-[#d9ed7a] hover:text-[#f7f6f2]" to="/register">Register</Link></p>
                <Link className="mt-3 block text-center text-sm text-[#7f8779] hover:text-[#d9ed7a]" to="/">Back to entry page</Link>
            </section>
        </main>
    )
}
