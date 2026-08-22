'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, XCircle } from 'lucide-react'

interface Props {
  onScan: (data: string) => void
  onError: (error: string) => void
}

export default function QRScanner({ onScan, onError }: Props) {
  const videoRef    = useRef<HTMLVideoElement>(null)
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const streamRef   = useRef<MediaStream | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [loading, setLoading] = useState(true)
  const [active, setActive]   = useState(true)

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setLoading(false)
        startScanning()
      }
    } catch {
      onError('Camera access denied. Please allow camera permissions and try again.')
    }
  }

  function stopCamera() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
  }

  function startScanning() {
    // Use BarcodeDetector if available (Chrome/Edge on Android/desktop)
    if ('BarcodeDetector' in window) {
      // @ts-expect-error BarcodeDetector is experimental API
      const detector = new window.BarcodeDetector({ formats: ['qr_code'] }) as { detect: (src: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> }
      intervalRef.current = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return
        try {
          const codes = await detector.detect(videoRef.current)
          if (codes.length > 0) {
            setActive(false)
            stopCamera()
            onScan(codes[0].rawValue)
          }
        } catch { /* ignore */ }
      }, 300)
    } else {
      // Fallback: canvas + jsQR
      intervalRef.current = setInterval(async () => {
        if (!videoRef.current || !canvasRef.current) return
        if (videoRef.current.readyState < 2) return
        const ctx = canvasRef.current.getContext('2d')
        if (!ctx) return
        canvasRef.current.width  = videoRef.current.videoWidth
        canvasRef.current.height = videoRef.current.videoHeight
        ctx.drawImage(videoRef.current, 0, 0)
        const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)
        // Dynamic import jsQR
        const jsQR = (await import('jsqr')).default
        const code = jsQR(imageData.data, imageData.width, imageData.height)
        if (code) {
          setActive(false)
          stopCamera()
          onScan(code.data)
        }
      }, 300)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: '#000', border: '2px solid var(--color-brand-400)', aspectRatio: '1' }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          </div>
        )}
        <video ref={videoRef} playsInline muted
          className="w-full h-full object-cover"
          style={{ display: loading ? 'none' : 'block' }} />
        <canvas ref={canvasRef} className="hidden" />

        {/* Scan overlay */}
        {!loading && active && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-48 h-48">
              {/* Corner guides */}
              {[
                'top-0 left-0 border-t-4 border-l-4',
                'top-0 right-0 border-t-4 border-r-4',
                'bottom-0 left-0 border-b-4 border-l-4',
                'bottom-0 right-0 border-b-4 border-r-4',
              ].map((cls, i) => (
                <div key={i} className={`absolute w-8 h-8 rounded-sm ${cls}`}
                  style={{ borderColor: 'var(--color-brand-400)' }} />
              ))}
              {/* Scan line */}
              <div className="absolute top-0 left-4 right-4 h-0.5 animate-scan-line"
                style={{ background: 'var(--color-brand-400)', boxShadow: '0 0 8px var(--color-brand-400)' }} />
            </div>
          </div>
        )}
      </div>

      <p className="text-sm text-center" style={{ color: 'var(--color-muted)' }}>
        Align the QR code within the frame. Detection is automatic.
      </p>
    </div>
  )
}
