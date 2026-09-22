import { useLocation, useNavigate } from 'react-router-dom'

export function JoinedLobbyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const tableName = (location.state as { tableName?: string } | null)?.tableName

  return (
    <main className="min-h-screen bg-[#111311] px-5 py-6 text-[#f7f6f2] sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-lg flex-col justify-center text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#b7d334]">Table lobby</p>
        <h1 className="mt-3 font-['Space_Grotesk'] text-4xl font-bold tracking-tight">You’re in.</h1>
        <p className="mt-4 text-base leading-7 text-[#a5aaa1]">{tableName ? `You joined ${tableName}.` : 'You joined the table lobby successfully.'}</p>
        <button className="mt-10 w-full rounded-xl bg-[#b7d334] px-4 py-3.5 font-semibold text-[#151712] transition hover:bg-[#c9e34e] focus:outline-none focus:ring-2 focus:ring-[#d9ed7a] focus:ring-offset-2 focus:ring-offset-[#111311]" type="button" onClick={() => navigate('/authenticated')}>Back to home</button>
      </div>
    </main>
  )
}
