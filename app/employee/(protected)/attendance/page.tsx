'use client'

import { useState, useEffect } from 'react'
import { QrCode, MapPin, CheckCircle2, Clock, LogOut, Loader2, AlertCircle, ClipboardList } from 'lucide-react'
import { formatWorkingHours } from '@/lib/utils'
import type { Attendance } from '@/types'
import QRScanner from '@/components/attendance/QRScanner'

export default function EmployeeAttendancePage() {
  const [attendance, setAttendance] = useState<Attendance | null>(null)
  const [loading, setLoading]       = useState(true)
  const [step, setStep]             = useState<'idle' | 'scanning' | 'locating' | 'checkout'>('idle')
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState('')
  const [workCompleted, setWorkCompleted] = useState('')
  const [scannedPayload, setScannedPayload] = useState<{ location_id: string; location_name: string; timestamp: number } | null>(null)

  useEffect(() => { loadAttendance() }, [])

  async function loadAttendance() {
    const res = await fetch('/api/attendance/today')
    const { data } = await res.json()
    setAttendance(data)
    setLoading(false)
  }

  // Called when QR is successfully scanned
  async function handleQRScanned(rawPayload: string) {
    setError('')
    try {
      const payload = JSON.parse(rawPayload) as { location_id: string; location_name: string; timestamp: number }

      // Validate QR is not too old (5 min = 300_000 ms)
      if (Date.now() - payload.timestamp > 300_000) {
        setError('QR code has expired. Please ask admin to refresh it.')
        setStep('idle')
        return
      }

      setScannedPayload(payload)
      setStep('locating')
      await requestLocationAndCheckIn(payload)
    } catch {
      setError('Invalid QR code. Please scan the correct MUJ HRMS QR code.')
      setStep('idle')
    }
  }

  async function requestLocationAndCheckIn(payload: { location_id: string; location_name: string }) {
    if (!navigator.geolocation) {
      setError('Your browser does not support GPS. Use a modern mobile browser.')
      setStep('idle')
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        const res = await fetch('/api/attendance/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latitude, longitude, qrLocationId: payload.location_id }),
        })
        const result = await res.json()
        if (!res.ok) {
          setError(result.error)
          setStep('idle')
          return
        }
        setSuccess('Checked in successfully! 🎉')
        setStep('idle')
        await loadAttendance()
      },
      (err) => {
        setError(`Location error: ${err.message}. Please allow location access and try again.`)
        setStep('idle')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  async function handleCheckout() {
    setError('')
    if (!workCompleted.trim()) {
      setError('Please describe the work you completed today before checking out.')
      return
    }

    if (!navigator.geolocation) {
      setError('Your browser does not support GPS.')
      return
    }

    setStep('locating')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        const res = await fetch('/api/attendance/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latitude, longitude, workCompleted }),
        })
        const result = await res.json()
        if (!res.ok) {
          setError(result.error)
          setStep('checkout')
          return
        }
        setSuccess('Checked out successfully! Have a great evening 👋')
        setStep('idle')
        await loadAttendance()
      },
      (err) => {
        setError(`Location error: ${err.message}`)
        setStep('idle')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-brand-400)' }} />
    </div>
  )

  const isCheckedIn  = !!attendance?.check_in
  const isCheckedOut = !!attendance?.check_out

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="page-header">
        <h1>Attendance</h1>
        <p>Scan the company QR code to mark your attendance.</p>
      </div>

      {/* Success / Error messages */}
      {success && (
        <div className="mb-5 px-4 py-3.5 rounded-xl flex items-center gap-3"
          style={{ background: 'var(--color-success-bg)', border: '1px solid hsl(142 50% 20%)', color: 'var(--color-success)' }}>
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{success}</span>
        </div>
      )}
      {error && (
        <div className="mb-5 px-4 py-3.5 rounded-xl flex items-center gap-3"
          style={{ background: 'var(--color-danger-bg)', border: '1px solid hsl(0 50% 25%)', color: 'var(--color-danger)' }}>
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Status card */}
      <div className="card mb-5">
        {isCheckedOut ? (
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl" style={{ background: 'var(--color-success-bg)' }}>
              <CheckCircle2 className="w-8 h-8" style={{ color: 'var(--color-success)' }} />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-success)' }}>Attendance Complete</h2>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                Worked {formatWorkingHours(attendance?.working_hours)} today ·
                In: {new Date(attendance!.check_in!).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} ·
                Out: {new Date(attendance!.check_out!).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ) : isCheckedIn ? (
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl animate-pulse-slow" style={{ background: 'var(--color-info-bg)' }}>
              <Clock className="w-8 h-8" style={{ color: 'var(--color-info)' }} />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-info)' }}>Currently Checked In</h2>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                Since {new Date(attendance!.check_in!).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} ·
                Distance: {attendance!.check_in_distance}m from office
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl" style={{ background: 'hsl(224 75% 50% / 0.15)' }}>
              <QrCode className="w-8 h-8" style={{ color: 'var(--color-brand-400)' }} />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-foreground)' }}>Not Checked In</h2>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Scan the company QR code to check in</p>
            </div>
          </div>
        )}
      </div>

      {/* Check-in flow — QR Scanner */}
      {!isCheckedIn && !isCheckedOut && (
        <div className="card mb-5">
          <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--color-foreground)' }}>
            Step 1 — Scan QR Code
          </h2>

          {step === 'scanning' ? (
            <QRScanner onScan={handleQRScanned} onError={(e) => { setError(e); setStep('idle') }} />
          ) : step === 'locating' ? (
            <div className="flex flex-col items-center py-10 gap-3">
              <div className="relative">
                <MapPin className="w-10 h-10" style={{ color: 'var(--color-brand-400)' }} />
                <div className="absolute inset-0 w-10 h-10 rounded-full animate-ping opacity-20"
                  style={{ background: 'var(--color-brand-400)' }} />
              </div>
              <p className="font-medium" style={{ color: 'var(--color-foreground)' }}>Validating your location...</p>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>GPS is being checked server-side</p>
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 gap-4">
              <div className="p-6 rounded-3xl" style={{ background: 'var(--color-surface-2)', border: '2px dashed var(--color-border)' }}>
                <QrCode className="w-16 h-16" style={{ color: 'var(--color-muted)' }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                  Point your camera at the QR code displayed at the office entrance
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                  Make sure you are physically present at Manipal University Jaipur
                </p>
              </div>
              <button onClick={() => { setError(''); setSuccess(''); setStep('scanning') }}
                className="btn btn-primary px-8">
                <QrCode className="w-4 h-4" /> Start Camera
              </button>
            </div>
          )}
        </div>
      )}

      {/* Check-out flow */}
      {isCheckedIn && !isCheckedOut && (
        <div className="card mb-5">
          <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--color-foreground)' }}>
            <LogOut className="inline w-5 h-5 mr-2" />Check Out
          </h2>

          {step === 'locating' ? (
            <div className="flex flex-col items-center py-8 gap-3">
              <div className="relative">
                <MapPin className="w-10 h-10" style={{ color: 'var(--color-warning)' }} />
                <div className="absolute inset-0 w-10 h-10 rounded-full animate-ping opacity-20"
                  style={{ background: 'var(--color-warning)' }} />
              </div>
              <p className="font-medium" style={{ color: 'var(--color-foreground)' }}>Validating location for checkout...</p>
            </div>
          ) : (
            <>
              {step !== 'checkout' && (
                <button onClick={() => { setError(''); setStep('checkout') }}
                  className="btn btn-secondary w-full">
                  <LogOut className="w-4 h-4" /> Proceed to Check Out
                </button>
              )}
              {step === 'checkout' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-foreground)' }}>
                      <ClipboardList className="inline w-4 h-4 mr-1" />
                      Work Completed Today *
                    </label>
                    <textarea value={workCompleted} onChange={e => setWorkCompleted(e.target.value)}
                      placeholder="Describe what you accomplished today (tasks completed, progress made, etc.)"
                      rows={4} className="input-base resize-none" />
                    <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                      This will be visible to your manager.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setStep('idle')} className="btn btn-secondary flex-1">
                      Cancel
                    </button>
                    <button onClick={handleCheckout} className="btn btn-primary flex-1"
                      style={{ background: 'linear-gradient(135deg, hsl(142 60% 40%), hsl(224 75% 50%))' }}>
                      <LogOut className="w-4 h-4" /> Confirm Check Out
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* GPS note */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl"
        style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-muted)' }} />
        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
          GPS location is validated server-side against Manipal University Jaipur coordinates.
          You must be within 100m of the campus to check in or out.
        </p>
      </div>
    </div>
  )
}
