import { AlertTriangle, ArrowLeft, CheckCircle2, Club, Eye, EyeOff, LockKeyhole, LogIn, UserRound } from 'lucide-react'
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
    const [showPassword, setShowPassword] = useState(false)
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
        <main className="app-shell">
            <div className="mobile-shell">
                <section className="form-card" aria-label="Login form">
                    <div className="mb-6 flex items-center gap-3" aria-label="Pocket Chips">
                        <span className="brand-mark" aria-hidden="true"><Club size={20} strokeWidth={2.2} /></span>
                        <span className="brand-title">Pocket Chips</span>
                    </div>

                    <div className="mb-7">
                        <span className="eyebrow">Welcome back</span>
                        <h1 className="mt-4 font-['Space_Grotesk'] text-3xl font-bold tracking-[-0.06em] text-white">Sign in to your table</h1>
                        <p className="mt-2 text-sm leading-6 text-[#a5aaa1]">Keep your game close wherever the table takes you.</p>
                    </div>

                    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                        <div className="form-field">
                            <label htmlFor="username">Username</label>
                            <div className="input-with-icon">
                                <UserRound size={18} strokeWidth={2.1} />
                                <input className="form-input" id="username" name="username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Enter your username" disabled={isSubmitting} />
                            </div>
                        </div>

                        <div className="form-field">
                            <label htmlFor="password">Password</label>
                            <div className="input-with-icon">
                                <LockKeyhole size={18} strokeWidth={2.1} />
                                <input className="form-input" id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" disabled={isSubmitting} />
                                <button type="button" className="input-toggle" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                                    {showPassword ? <EyeOff size={18} strokeWidth={2.1} /> : <Eye size={18} strokeWidth={2.1} />}
                                </button>
                            </div>
                        </div>

                        {errorMessage && <div className="form-error" role="alert"><span aria-hidden="true"><AlertTriangle size={16} strokeWidth={2.3} /></span><span>{errorMessage}</span></div>}
                        {successMessage && <div className="form-success" role="status"><span aria-hidden="true"><CheckCircle2 size={16} strokeWidth={2.4} /></span><span>{successMessage}</span></div>}

                        <button className="primary-button" type="submit" disabled={isSubmitting}><LogIn size={18} strokeWidth={2.2} /><span>{isSubmitting ? 'Signing in...' : 'Sign in'}</span></button>
                    </form>

                    <p className="mt-5 text-center text-sm text-[#a5aaa1]">Need an account? <Link className="inline-link" to="/register">Register</Link></p>
                    <Link className="mt-3 inline-flex items-center justify-center gap-2 text-center text-sm text-[#7f8779] hover:text-[#d9ed7a]" to="/"><ArrowLeft size={14} strokeWidth={2.2} />Back to entry page</Link>
                </section>
            </div>
        </main>
    )
}
