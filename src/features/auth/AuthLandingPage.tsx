import { Link } from 'react-router-dom'

export function AuthLandingPage() {
    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#111311] px-5 py-10 text-[#f7f6f2]">
            <div className="pointer-events-none absolute -left-28 -top-28 h-72 w-72 rounded-full bg-[#b7d334]/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-36 -right-28 h-96 w-96 rounded-full bg-[#dd6b3d]/10 blur-3xl" />
            <section className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-[#1a1d19]/95 p-7 shadow-2xl shadow-black/40 sm:p-9">
                <div className="mb-10 flex items-center gap-3" aria-label="Pocket Chips">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#b7d334] text-xl font-bold text-[#151712] shadow-lg shadow-[#b7d334]/10">♠</span>
                    <span className="font-['Space_Grotesk'] text-lg font-semibold tracking-tight">Pocket Chips</span>
                </div>
                <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-[#b7d334]">Your table, together</p>
                <h1 className="font-['Space_Grotesk'] text-4xl font-bold tracking-tight">Play poker with your friends.</h1>
                <p className="mt-4 text-sm leading-6 text-[#a5aaa1]">Sign in to continue or create an account to get started.</p>
                <div className="mt-9 space-y-3">
                    <Link className="flex h-12 w-full items-center justify-center rounded-xl bg-[#b7d334] px-4 font-semibold text-[#151712] transition hover:bg-[#c9e34e] focus:outline-none focus:ring-2 focus:ring-[#d9ed7a] focus:ring-offset-2 focus:ring-offset-[#1a1d19]" to="/login">Login</Link>
                    <Link className="flex h-12 w-full items-center justify-center rounded-xl border border-white/15 px-4 font-semibold text-[#f7f6f2] transition hover:border-[#b7d334] hover:text-[#d9ed7a] focus:outline-none focus:ring-2 focus:ring-[#b7d334]/40" to="/register">Register</Link>
                </div>
            </section>
        </main>
    )
}
