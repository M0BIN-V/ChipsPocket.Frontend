import { AlertTriangle, ArrowLeft, Club, Eye, EyeOff, LockKeyhole, UserRound, UserRoundPlus } from 'lucide-react'
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
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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
        <main className="app-shell">
            <div className="mobile-shell">
                <section className="form-card" aria-label="Register form">
                    <div className="mb-6 flex items-center gap-3" aria-label="Pocket Chips">
                        <span className="brand-mark" aria-hidden="true"><Club size={20} strokeWidth={2.2} /></span>
                        <span className="brand-title">Pocket Chips</span>
                    </div>

                    <div className="mb-7">
                        <span className="eyebrow">Join the table</span>
                        <h1 className="mt-4 font-['Space_Grotesk'] text-3xl font-bold tracking-[-0.06em] text-white">Create your account</h1>
                        <p className="mt-2 text-sm leading-6 text-[#a5aaa1]">Set up your profile and get ready for your next home game.</p>
                    </div>

                    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                        <div className="form-field">
                            <label htmlFor="register-username">Username</label>
                            <div className="input-with-icon">
                                <UserRound size={18} strokeWidth={2.1} />
                                <input className="form-input" id="register-username" name="username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Choose a username" disabled={isSubmitting} />
                            </div>
                        </div>

                        <div className="form-field">
                            <label htmlFor="register-password">Password</label>
                            <div className="input-with-icon">
                                <LockKeyhole size={18} strokeWidth={2.1} />
                                <input className="form-input" id="register-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" disabled={isSubmitting} />
                                <button type="button" className="input-toggle" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                                    {showPassword ? <EyeOff size={18} strokeWidth={2.1} /> : <Eye size={18} strokeWidth={2.1} />}
                                </button>
                            </div>
                        </div>

                        <div className="form-field">
                            <label htmlFor="confirm-password">Confirm password</label>
                            <div className="input-with-icon">
                                <LockKeyhole size={18} strokeWidth={2.1} />
                                <input className="form-input" id="confirm-password" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat your password" disabled={isSubmitting} />
                                <button type="button" className="input-toggle" onClick={() => setShowConfirmPassword((current) => !current)} aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}>
                                    {showConfirmPassword ? <EyeOff size={18} strokeWidth={2.1} /> : <Eye size={18} strokeWidth={2.1} />}
                                </button>
                            </div>
                        </div>

                        {errorMessages.length > 0 && (
                            <div className="form-error" role="alert">
                                <span aria-hidden="true"><AlertTriangle size={16} strokeWidth={2.3} /></span>
                                <ul className="m-0 list-disc space-y-1 pl-4">
                                    {errorMessages.map((message, index) => <li key={`${message}-${index}`}>{message}</li>)}
                                </ul>
                            </div>
                        )}

                        <button className="primary-button" type="submit" disabled={isSubmitting}><UserRoundPlus size={18} strokeWidth={2.1} /><span>{isSubmitting ? 'Creating account...' : 'Register'}</span></button>
                    </form>

                    <p className="mt-5 text-center text-sm text-[#a5aaa1]">Already have an account? <Link className="inline-link" to="/login">Login</Link></p>
                    <Link className="mt-3 inline-flex items-center justify-center gap-2 text-center text-sm text-[#7f8779] hover:text-[#d9ed7a]" to="/"><ArrowLeft size={14} strokeWidth={2.2} />Back to entry page</Link>
                </section>
            </div>
        </main>
    )
}
