import { useEffect, useState } from 'react'
import { getBackendVersion } from '../api/version'
import { frontendVersion } from '../config/appVersion'

export function VersionInfo() {
  const [backendVersion, setBackendVersion] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    getBackendVersion().then((version) => {
      if (isMounted) setBackendVersion(version)
    }).catch(() => {
      if (isMounted) setBackendVersion('Unknown')
    })

    return () => { isMounted = false }
  }, [])

  return (
    <footer className="version-info" aria-label="Application versions" aria-live="polite">
      <span>Frontend: v{frontendVersion}</span>
      <span>Backend: {backendVersion ? `v${backendVersion}` : '—'}</span>
    </footer>
  )
}