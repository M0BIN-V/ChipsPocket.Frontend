import { useState, type FormEvent } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../../api/auth'
import type { ValidationProblemDetails } from './auth.types'

function getValidationMessages(data: unknown): string[] {
    if (!data || typeof data !== 'object') return []
    const problem = data as ValidationProblemDetails
    return problem.errors ? Object.values(problem.errors).flat() : []
}

function getRegisterError(error: unknown): string[] {
    if (axios.isAxiosError(error)) {
        if (!error.response) return ['Unable to connect to the server.']
        if (error.response.status === 409 && typeof error.response.data === 'string') return [error.response.data]
        if (error.response.status === 400) {
            const messages = getValidationMessages(error.response.data)
            if (messages.length > 0) return messages
        }
    }
    return ['Something went wrong. Please try again.']
}

export function RegisterPage() {
    const navigate = useNavigate()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [errorMessages, setErrorMessages] = useState<string[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const trimmedUsername = username.trim()
        const validationMessages: string[] = []

        if (!trimmedUsername) validationMessages.push('Enter a username.')
        if (!password) validationMessages.push('Enter a password.')
        else if (password.length < 6) validationMessages.push('Password must be at least 6 characters.')
        if (password !== confirmPassword) validationMessages.push('Passwords do not match.')

        if (validationMessages.length > 0) {
            setErrorMessages(validationMessages)
            return
        }

        setErrorMessages([])
        setIsSubmitting(true)
        try {
            await register({ username: trimmedUsername, password })
            navigate('/login', { replace: true, state: { successMessage: 'Account created successfully. Please log in.' } })
        } catch (error: unknown) {
            setErrorMessages(getRegisterError(error))
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
                    <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-[#b7d334]">Join the table</p>
                    <h1 className="font-['Space_Grotesk'] text-3xl font-bold tracking-tight">Create your account</h1>
                    <p className="mt-3 text-sm leading-6 text-[#a5aaa1]">Set up your account and play with your friends.</p>
                </div>
                <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                    <div><label className="mb-2 block text-sm font-medium text-[#d8dbd3]" htmlFor="register-username">Username</label><input className="h-12 w-full rounded-xl border border-white/10 bg-[#111311] px-4 text-base text-[#f7f6f2] outline-none transition placeholder:text-[#6f756c] focus:border-[#b7d334] focus:ring-2 focus:ring-[#b7d334]/20" id="register-username" name="username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Choose a username" disabled={isSubmitting} /></div>
                    <div><label className="mb-2 block text-sm font-medium text-[#d8dbd3]" htmlFor="register-password">Password</label><input className="h-12 w-full rounded-xl border border-white/10 bg-[#111311] px-4 text-base text-[#f7f6f2] outline-none transition placeholder:text-[#6f756c] focus:border-[#b7d334] focus:ring-2 focus:ring-[#b7d334]/20" id="register-password" name="password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" disabled={isSubmitting} /></div>
                    <div><label className="mb-2 block text-sm font-medium text-[#d8dbd3]" htmlFor="confirm-password">Confirm password</label><input className="h-12 w-full rounded-xl border border-white/10 bg-[#111311] px-4 text-base text-[#f7f6f2] outline-none transition placeholder:text-[#6f756c] focus:border-[#b7d334] focus:ring-2 focus:ring-[#b7d334]/20" id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat your password" disabled={isSubmitting} /></div>
                    {errorMessages.length > 0 && <div className="rounded-xl border border-[#e27350]/30 bg-[#e27350]/10 px-4 py-3 text-sm text-[#ffad93]" role="alert"><ul className="list-disc space-y-1 pl-4">{errorMessages.map((message, index) => <li key={`${message}-${index}`}>{message}</li>)}</ul></div>}
                    <button className="h-12 w-full rounded-xl bg-[#b7d334] px-4 font-semibold text-[#151712] transition hover:bg-[#c9e34e] focus:outline-none focus:ring-2 focus:ring-[#d9ed7a] focus:ring-offset-2 focus:ring-offset-[#1a1d19] disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating account...' : 'Register'}</button>
                </form>
                <p className="mt-6 text-center text-sm text-[#a5aaa1]">Already have an account? <Link className="font-semibold text-[#d9ed7a] hover:text-[#f7f6f2]" to="/login">Login</Link></p>
                <Link className="mt-3 block text-center text-sm text-[#7f8779] hover:text-[#d9ed7a]" to="/">Back to entry page</Link>
            </section>
        </main>
    )
}
