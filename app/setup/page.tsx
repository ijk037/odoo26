'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Mail, Lock, User, Eye, EyeOff, Loader2, CheckCircle2, ArrowRight } from 'lucide-react'

export default function AdminSetupPage() {
  const router = useRouter()
  const [fullName, setFullName]         = useState('')
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [success, setSuccess]           = useState(false)

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/create-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName }),
    })
    const result = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(result.error ?? 'Setup failed. Please try again.')
      return
    }

    setSuccess(true)
    setTimeout(() => router.push('/admin/login'), 2500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-background)' }}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, hsl(224 75% 50%), transparent 70%)', filter: 'blur(40px)' }} />
      </div>

      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
            style={{ background: 'linear-gradient(135deg, hsl(224 75% 50%), hsl(262 60% 55%))' }}>
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-foreground)' }}>Admin Setup</h1>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            Create the first administrator account to get started
          </p>
        </div>

        {success ? (
          <div className="card text-center py-10">
            <CheckCircle2 className="w-14 h-14 mx-auto mb-4" style={{ color: 'var(--color-success)' }} />
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--color-foreground)' }}>Admin account ready!</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--color-muted)' }}>Redirecting you to the login page...</p>
            <Link href="/admin/login" className="btn btn-primary">Go to Admin Login</Link>
          </div>
        ) : (
          <div className="card">
            <div className="mb-5 px-4 py-3 rounded-xl text-sm"
              style={{ background: 'hsl(224 75% 50% / 0.1)', border: '1px solid hsl(224 75% 50% / 0.3)', color: 'hsl(224 80% 70%)' }}>
              <strong>One-time setup:</strong> This creates or promotes a user to admin. Run this only once to set up your first admin account.
            </div>

            {error && (
              <div className="mb-5 px-4 py-3 rounded-xl text-sm flex items-start gap-2"
                style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid hsl(0 50% 25%)' }}>
                <span className="mt-0.5">⚠</span> {error}
              </div>
            )}

            <form onSubmit={handleSetup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-foreground)' }}>Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-muted)' }} />
                  <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                    placeholder="Administrator Name" className="input-base pl-10" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-foreground)' }}>Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-muted)' }} />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="admin@company.com" className="input-base pl-10" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-foreground)' }}>Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-muted)' }} />
                  <input type={showPassword ? 'text' : 'password'} required value={password}
                    onChange={e => setPassword(e.target.value)} minLength={8}
                    placeholder="Min 8 characters" className="input-base pl-10 pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-80"
                    style={{ color: 'var(--color-muted)' }}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="btn btn-primary w-full py-3 flex items-center justify-center gap-2">
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating admin...</>
                  : <><Shield className="w-4 h-4" /> Create Admin Account<ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>

            <div className="mt-5 pt-4 text-center" style={{ borderTop: '1px solid var(--color-border)' }}>
              <Link href="/admin/login" className="text-sm hover:opacity-80 transition-opacity"
                style={{ color: 'var(--color-muted)' }}>
                Already have an admin account? Sign in →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
