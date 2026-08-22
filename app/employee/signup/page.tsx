'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, Eye, EyeOff, Loader2, UserPlus, ArrowRight, User, CheckCircle2 } from 'lucide-react'

export default function EmployeeSignupPage() {
  const router = useRouter()
  const [fullName, setFullName]         = useState('')
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }

    setLoading(true)

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName }),
    })
    const result = await res.json()

    if (!res.ok) {
      setError(result.error ?? 'Signup failed. Please try again.')
      setLoading(false)
      return
    }

    // Auto sign-in after successful signup
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })

    if (loginError) {
      setError('Account created! Please sign in manually.')
      setLoading(false)
      window.location.href = '/employee/login'
      return
    }

    window.location.href = '/employee/dashboard'
  }

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-background)' }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, hsl(224 60% 14%) 0%, hsl(224 50% 9%) 100%)' }}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, hsl(224 75% 55%), transparent 70%)' }} />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, hsl(262 60% 55%), transparent 70%)' }} />
        </div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, hsl(224 75% 50%), hsl(262 60% 55%))' }}>
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white">HRMS</span>
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Join the<br />Team
          </h2>
          <p className="text-base mb-10" style={{ color: 'hsl(224 30% 68%)' }}>
            Create your account to start your journey. Your profile will be reviewed by HR before you get full access.
          </p>
          {['Instant account creation', 'Complete your profile', 'HR review & approval', 'Full system access'].map((f, i) => (
            <div key={f} className="flex items-center gap-3 mb-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: 'hsl(224 75% 45%)' }}>
                {i + 1}
              </div>
              <span className="text-sm" style={{ color: 'hsl(224 20% 70%)' }}>{f}</span>
            </div>
          ))}
        </div>
        <p className="relative text-xs" style={{ color: 'hsl(224 20% 40%)' }}>Human Resource Management System</p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, hsl(224 75% 50%), hsl(262 60% 55%))' }}>
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold" style={{ color: 'var(--color-foreground)' }}>HRMS</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-foreground)' }}>Create Account</h1>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Fill in your details to get started</p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl text-sm flex items-start gap-2"
              style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid hsl(0 50% 25%)' }}>
              <span className="flex-shrink-0 mt-0.5">⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-foreground)' }}>Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-muted)' }} />
                <input id="signup-fullname" type="text" required autoComplete="name"
                  value={fullName} onChange={e => setFullName(e.target.value)}
                  placeholder="Your full name" className="input-base pl-10" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-foreground)' }}>Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-muted)' }} />
                <input id="signup-email" type="email" required autoComplete="email"
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com" className="input-base pl-10" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-foreground)' }}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-muted)' }} />
                <input id="signup-password" type={showPassword ? 'text' : 'password'} required autoComplete="new-password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Min 8 characters" className="input-base pl-10 pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-80 transition-opacity"
                  style={{ color: 'var(--color-muted)' }}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="mt-2 flex gap-1">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-1 flex-1 rounded-full transition-all"
                      style={{ background: i <= strength
                        ? strength === 1 ? 'var(--color-danger)' : strength === 2 ? 'var(--color-warning)' : 'var(--color-success)'
                        : 'var(--color-surface-3)' }} />
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-foreground)' }}>Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-muted)' }} />
                <input id="signup-confirm-password" type={showPassword ? 'text' : 'password'} required autoComplete="new-password"
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password" className="input-base pl-10 pr-10" />
                {confirmPassword.length > 0 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {password === confirmPassword
                      ? <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
                      : <span className="text-xs" style={{ color: 'var(--color-danger)' }}>✗</span>}
                  </div>
                )}
              </div>
            </div>

            <button id="signup-btn" type="submit" disabled={loading}
              className="btn btn-primary w-full py-3 mt-2 flex items-center justify-center gap-2">
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
                : <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="mt-5">
            <Link href="/employee/login"
              className="block w-full text-center py-3 rounded-xl text-sm font-medium transition-all"
              style={{ background: 'var(--color-surface-2)', color: 'var(--color-foreground)', border: '1px solid var(--color-border)' }}>
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
