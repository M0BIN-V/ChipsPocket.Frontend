import { useEffect, useRef, useState } from 'react'
import QrScannerLibrary from 'qr-scanner'

interface QrScannerProps {
  onScan: (value: string) => boolean
  onClose: () => void
}

function getCameraErrorMessage(error: unknown): string {
  if (window.isSecureContext === false) {
    return 'Camera access requires HTTPS or localhost. Open this app over a secure development URL and try again.'
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    return 'This browser or connection does not support camera access. Use HTTPS or localhost in a supported browser.'
  }

  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
      return 'Camera permission was denied. Allow camera access in your browser settings and try again.'
    }
    if (error.name === 'NotFoundError' || error.name === 'OverconstrainedError') {
      return 'No usable camera was found on this device.'
    }
    if (error.name === 'NotReadableError' || error.name === 'AbortError') {
      return 'The camera is already in use by another app. Close it there and try again.'
    }
  }

  return 'The camera could not be started. Check your browser permissions and try again.'
}

export function QrScanner({ onScan, onClose }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hasScannedRef = useRef(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement) return

    let isActive = true
    let scanner: QrScannerLibrary | null = null

    async function startScanner() {
      try {
        if (window.isSecureContext === false) {
          throw new DOMException('Camera access requires a secure context.', 'SecurityError')
        }
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera access is not supported in this browser or context.')
        }

        if (!(await QrScannerLibrary.hasCamera())) {
          throw new DOMException('No camera is available.', 'NotFoundError')
        }

        const cameras = await QrScannerLibrary.listCameras(true)
        const preferredCamera = cameras.find((camera) => /back|rear|environment|world/i.test(camera.label)) ?? cameras[0]
        const activeScanner = new QrScannerLibrary(videoElement!, (result: { data: string }) => {
          if (!isActive || hasScannedRef.current) return
          if (onScan(result.data)) {
            hasScannedRef.current = true
            activeScanner.stop()
          } else {
            setErrorMessage('That QR code is not a valid ChipsPocket table invite.')
          }
        }, { preferredCamera: preferredCamera?.id ?? 'environment', returnDetailedScanResult: true })
        scanner = activeScanner
        await activeScanner.start()
      } catch (error: unknown) {
        if (isActive) setErrorMessage(getCameraErrorMessage(error))
      }
    }

    void startScanner()
    return () => {
      isActive = false
      scanner?.stop()
      scanner?.destroy()
    }
  }, [onScan])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#080a08]/85 px-4 py-6 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-[#1a1d19] p-5 shadow-2xl shadow-black/40 sm:p-7" role="dialog" aria-modal="true" aria-labelledby="scan-table-title">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#b7d334]">Join a table</p>
            <h2 id="scan-table-title" className="mt-1 font-['Space_Grotesk'] text-2xl font-bold">Scan QR code</h2>
          </div>
          <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-xl text-[#c3c8bd] transition hover:border-white/25 focus:outline-none focus:ring-2 focus:ring-[#b7d334]/40" type="button" onClick={onClose} aria-label="Close QR scanner">×</button>
        </div>
        <p className="mt-3 text-sm leading-6 text-[#a5aaa1]">Point your camera at a ChipsPocket table QR code.</p>
        <div className="relative mt-6 aspect-square overflow-hidden rounded-2xl border border-white/10 bg-[#0d100d]">
          <video ref={videoRef} className="h-full w-full object-cover" autoPlay muted playsInline aria-label="Live QR scanner camera preview" />
          <div className="pointer-events-none absolute inset-[16%] rounded-2xl border-2 border-[#b7d334]/80 shadow-[0_0_0_999px_#080a0888]" aria-hidden="true" />
        </div>
        {errorMessage && <p className="mt-4 rounded-xl border border-[#e27350]/30 bg-[#e27350]/10 px-4 py-3 text-sm leading-5 text-[#ffad93]" role="alert">{errorMessage}</p>}
        <button className="mt-5 w-full rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-[#d8dbd3] transition hover:border-white/25 focus:outline-none focus:ring-2 focus:ring-[#b7d334]/40" type="button" onClick={onClose}>Cancel</button>
      </section>
    </div>
  )
}