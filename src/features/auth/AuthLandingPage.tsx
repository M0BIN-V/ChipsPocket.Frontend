import { CheckCircle2, Club } from 'lucide-react'
import { Link } from 'react-router-dom'

export function AuthLandingPage() {
    return (
        <main className="app-shell">
            <div className="mobile-shell">
                <section className="auth-card" aria-label="Pocket Chips welcome">
                    <div className="page-header" style={{ marginBottom: '14px' }}>
                        <div className="flex items-center gap-3" aria-label="Pocket Chips">
                            <span className="brand-mark" aria-hidden="true"><Club size={20} strokeWidth={2.2} /></span>
                            <span className="brand-title">Pocket Chips</span>
                        </div>
                    </div>

                    <div className="hero-visual" aria-hidden="true">
                        <div className="hero-chip"><Club size={42} strokeWidth={2.2} /></div>
                    </div>

                    <div className="spacing-stack">
                        <span className="eyebrow">Your table, together</span>
                        <div>
                            <h1 className="font-['Space_Grotesk'] text-4xl font-bold tracking-[-0.06em] text-white">Play poker with your friends.</h1>
                            <p className="mt-3 text-sm leading-6 text-[#a5aaa1]">Organize seats, share joins, and keep your game moving from anywhere.</p>
                        </div>

                        <div className="feature-badges" aria-label="App highlights">
                            <span className="feature-badge"><span className="feature-mark"><CheckCircle2 size={14} strokeWidth={2.5} /></span> Mobile friendly</span>
                            <span className="feature-badge"><span className="feature-mark"><CheckCircle2 size={14} strokeWidth={2.5} /></span> Live tables</span>
                            <span className="feature-badge"><span className="feature-mark"><CheckCircle2 size={14} strokeWidth={2.5} /></span> Easy share</span>
                        </div>

                        <div className="mt-2 space-y-3">
                            <Link className="primary-button" to="/login">Login</Link>
                            <Link className="secondary-button" to="/register">Create account</Link>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    )
}
