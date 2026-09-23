import { AlertTriangle, ChevronRight, Club, LogOut, Plus, Share2, UserRound, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { getMe } from '../../api/auth'
import { authStorage } from '../../api/authStorage'
import type { MeResponse } from '../auth/auth.types'

export function HomePage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<MeResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isShareSheetOpen, setIsShareSheetOpen] = useState(false)
  const [shareNotice, setShareNotice] = useState<string | null>(null)
  const shareUrl = new URL('/', window.location.origin).toString()

  useEffect(() => {
    let isMounted = true
    getMe().then((response) => {
      if (isMounted) setUser(response)
    }).catch((error: unknown) => {
      if (!isMounted) return
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        navigate('/login', { replace: true })
        return
      }
      setErrorMessage('Unable to load your account.')
    })

    return () => { isMounted = false }
  }, [navigate])

  function handleLogout() {
    authStorage.clear()
    setIsProfileOpen(false)
    navigate('/login', { replace: true })
  }

  async function handleShareLink() {
    const shareData = {
      title: 'ChipsPocket',
      text: 'Join me on ChipsPocket and start a poker table.',
      url: shareUrl,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
        setShareNotice('Invite shared successfully.')
        return
      }
    } catch {
      // Fall through to clipboard fallback when the share sheet is cancelled.
    }

    try {
      await navigator.clipboard.writeText(shareUrl)
      setShareNotice('Link copied to your clipboard.')
    } catch {
      setShareNotice('Share link is ready below.')
    }
  }

  return (
    <main className="app-shell">
      <div className="mobile-shell">
        <header className="lobby-header">
          <div className="brand-group" aria-label="ChipsPocket">
            <span className="brand-mark" aria-hidden="true"><Club size={20} strokeWidth={2.2} /></span>
            <span className="brand-title">ChipsPocket</span>
          </div>

          <div className="profile-shell">
            <button className="profile-trigger" type="button" onClick={() => setIsProfileOpen((current) => !current)} aria-label="Open account menu">
              <span className="profile-avatar" aria-hidden="true">{user?.username?.charAt(0)?.toUpperCase() ?? 'P'}</span>
            </button>

            {isProfileOpen && (
              <div className="profile-menu" role="menu" aria-label="Account menu">
                <div className="profile-summary">
                  <span>Signed in as</span>
                  <strong>{user?.username ?? 'Player'}</strong>
                </div>
                <button className="menu-option" type="button" onClick={() => setIsProfileOpen(false)}>
                  <UserRound size={16} strokeWidth={2.2} />
                  <span>Profile</span>
                </button>
                <button className="menu-option danger" type="button" onClick={handleLogout}>
                  <LogOut size={16} strokeWidth={2.2} />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
        </header>

        <section className="home-card" aria-label="Main lobby screen">
          <div className="welcome-panel">
            <span className="eyebrow">Ready when you are</span>
            <h1>{user ? `Welcome back, ${user.username}` : 'Welcome back'}</h1>
            <p>{user ? 'Your next table is waiting.' : 'Loading your account...'}</p>
          </div>

          {errorMessage && (
            <div className="form-error mt-4" role="alert">
              <span aria-hidden="true"><AlertTriangle size={16} strokeWidth={2.3} /></span>
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="action-stack">
            <button className="action-card primary" type="button" onClick={() => navigate('/create-table')}>
              <span className="action-card-icon" aria-hidden="true"><Plus size={22} strokeWidth={2.3} /></span>
              <span className="action-copy">
                <strong>Create Table</strong>
                <span>Start a new poker table in seconds</span>
              </span>
              <span className="action-arrow" aria-hidden="true"><ChevronRight size={18} strokeWidth={2.4} /></span>
            </button>

            <button className="action-card" type="button" onClick={() => navigate('/join')}>
              <span className="action-card-icon" aria-hidden="true"><Users size={20} strokeWidth={2.3} /></span>
              <span className="action-copy">
                <strong>Join Table</strong>
                <span>Use a code or jump back into one of your tables</span>
              </span>
              <span className="action-arrow" aria-hidden="true"><ChevronRight size={18} strokeWidth={2.4} /></span>
            </button>

            <button className="action-card" type="button" onClick={() => setIsShareSheetOpen(true)}>
              <span className="action-card-icon" aria-hidden="true"><Share2 size={20} strokeWidth={2.2} /></span>
              <span className="action-copy">
                <strong>Invite Friends</strong>
                <span>Share ChipsPocket and get everyone in the game</span>
              </span>
              <span className="action-arrow" aria-hidden="true"><ChevronRight size={18} strokeWidth={2.4} /></span>
            </button>
          </div>
        </section>
      </div>

      {isShareSheetOpen && (
        <div className="sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsShareSheetOpen(false) }}>
          <section className="sheet-card" role="dialog" aria-modal="true" aria-labelledby="invite-friends-title">
            <div className="sheet-header">
              <div>
                <span className="eyebrow">Invite friends</span>
                <h2 id="invite-friends-title">Share ChipsPocket</h2>
              </div>
              <button className="icon-button" type="button" onClick={() => setIsShareSheetOpen(false)} aria-label="Close share dialog"><X size={18} strokeWidth={2.2} /></button>
            </div>

            <p className="mt-3 text-sm leading-6 text-[#a5aaa1]">Send your friends the link or scan the QR code to jump into the app.</p>

            <div className="qr-wrapper" aria-label="QR code to open ChipsPocket">
              <QRCodeSVG value={shareUrl} size={220} level="M" includeMargin bgColor="#ffffff" fgColor="#111311" aria-label="QR code to open ChipsPocket" />
            </div>

            <div className="share-actions">
              <button className="primary-button" type="button" onClick={() => { void handleShareLink() }}>
                <Share2 size={18} strokeWidth={2.2} />
                <span>Share link</span>
              </button>
              <button className="secondary-button" type="button" onClick={() => {
                void (async () => {
                  try {
                    await navigator.clipboard.writeText(shareUrl)
                    setShareNotice('Link copied to your clipboard.')
                  } catch {
                    setShareNotice('Share link is ready below.')
                  }
                })()
              }}>
                Copy link
              </button>
            </div>

            <p className="join-code-surface text-center">{shareUrl}</p>
          </section>
        </div>
      )}

      {shareNotice && (
        <p className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2 rounded-xl border border-[#b7d334]/30 bg-[#b7d334]/10 px-4 py-3 text-center text-sm text-[#d9ed7a]" role="status">
          {shareNotice}
        </p>
      )}
    </main>
  )
}
