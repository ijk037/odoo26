'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { Download, RefreshCw, QrCode } from 'lucide-react'

interface Props {
  locationId: string
  locationName: string
}

export default function QRGenerator({ locationId, locationName }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [expiresIn, setExpiresIn]   = useState(300) // 5 minutes

  // Regenerate QR every 5 minutes for security
  useEffect(() => {
    generateQR()
    const refreshInterval = setInterval(() => {
      setRefreshKey(k => k + 1)
      setExpiresIn(300)
    }, 300_000)

    const countdown = setInterval(() => {
      setExpiresIn(s => Math.max(0, s - 1))
    }, 1000)

    return () => { clearInterval(refreshInterval); clearInterval(countdown) }
  }, [refreshKey])

  async function generateQR() {
    if (!canvasRef.current) return
    const payload = JSON.stringify({
      location_id: locationId,
      location_name: locationName,
      timestamp: Date.now(),
    })
    await QRCode.toCanvas(canvasRef.current, payload, {
      width: 280,
      margin: 2,
      color: { dark: '#f1f5f9', light: '#0f172a' },
    })
  }

  function downloadQR() {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `qr-${locationName.replace(/\s+/g, '-').toLowerCase()}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  const minutes = Math.floor(expiresIn / 60)
  const seconds = expiresIn % 60
  const progressPct = (expiresIn / 300) * 100

  return (
    <div className="flex items-start gap-8">
      {/* QR Canvas */}
      <div className="flex flex-col items-center gap-3 flex-shrink-0">
        <div className="p-4 rounded-2xl" style={{ background: '#0f172a', border: '2px solid var(--color-border)' }}>
          <canvas ref={canvasRef} className="block" />
        </div>
        <div className="flex gap-2 w-full">
          <button onClick={downloadQR} className="btn btn-secondary flex-1 text-sm">
            <Download className="w-4 h-4" /> Download
          </button>
          <button onClick={() => setRefreshKey(k => k + 1)} className="btn btn-secondary flex-1 text-sm">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-4">
          <QrCode className="w-5 h-5" style={{ color: 'var(--color-brand-400)' }} />
          <span className="font-semibold" style={{ color: 'var(--color-foreground)' }}>QR Code Details</span>
        </div>

        <div className="space-y-3 mb-5">
          <div>
            <p className="text-xs uppercase tracking-wide font-semibold" style={{ color: 'var(--color-muted)' }}>Location</p>
            <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>{locationName}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide font-semibold" style={{ color: 'var(--color-muted)' }}>Security</p>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Rotates every 5 minutes · Server-side GPS validation</p>
          </div>
        </div>

        {/* Countdown */}
        <div className="p-4 rounded-xl" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
              Refreshes in
            </span>
            <span className="text-sm font-mono font-bold"
              style={{ color: expiresIn < 60 ? 'var(--color-warning)' : 'var(--color-success)' }}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-3)' }}>
            <div className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${progressPct}%`,
                background: expiresIn < 60 ? 'var(--color-warning)' : 'var(--color-success)',
              }} />
          </div>
        </div>

        <p className="text-xs mt-3" style={{ color: 'var(--color-muted)' }}>
          Display this QR code at the office entrance. Employees scan it on their phone to check in. GPS is validated server-side.
        </p>
      </div>
    </div>
  )
}
