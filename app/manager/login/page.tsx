'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, Eye, EyeOff, Loader2, Briefcase, ArrowRight, CheckCircle2 } from 'lucide-react'

export default function ManagerLoginPage() {
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

      console.log("[AUTH]", {
        success: !authError,
        userExists: !!data?.user,
        sessionExists: !!data?.session,
        error: authError?.message ?? null
      });

      if (!data.user) {
        setError('Invalid email or password. Please try again.')
        setLoading(false)
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, profile_status')
        .eq('id', data.user.id)
        .single()

      if (profileError || !profile) {
        setError('Error fetching profile: ' + (profileError?.message || 'Profile not found.'))
        setLoading(false)
        return
      }

      if (!profile.role) {
        setError('Your account does not have a valid role.')
        setLoading(false)
        return
      }

      const roleRoutes: Record<string, string> = {
        admin:    '/admin/dashboard',
        manager:  '/manager/dashboard',
        employee: '/employee/dashboard',
      }
      
      const redirectTo = roleRoutes[profile.role]

      if (!redirectTo) {
        setError(`Unknown user role: ${profile.role}`)
        setLoading(false)
        return
      }

      console.log("[LOGIN] authenticated:", !!data.user);
      console.log("[LOGIN] role:", profile.role);
      console.log("[REDIRECT] navigating to:", redirectTo);

      window.location.href = redirectTo
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-background)' }}>
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, hsl(262 50% 14%) 0%, hsl(262 40% 9%) 100%)' }}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, hsl(262 60% 55%), transparent 70%)' }} />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, hsl(224 75% 50%), transparent 70%)' }} />
        </div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, hsl(262 60% 55%), hsl(224 75% 50%))' }}>
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white">HRMS</span>
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">Lead Your<br />Team Forward</h2>
          <p className="text-base mb-10" style={{ color: 'hsl(262 30% 70%)' }}>
            Assign tasks, track attendance, and get AI-powered insights on your team&apos;s performance.
          </p>
          {['Daily task assignment with AI assist', 'Team attendance monitoring', 'Work report review', 'AI-generated team summaries'].map(f => (
            <div key={f} className="flex items-center gap-3 mb-3">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(262 60% 65%)' }} />
              <span className="text-sm" style={{ color: 'hsl(262 20% 72%)' }}>{f}</span>
            </div>
          ))}
        </div>
        <p className="relative text-xs" style={{ color: 'hsl(262 15% 40%)' }}>Human Resource Management System</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, hsl(262 60% 55%), hsl(224 75% 50%))' }}>
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold" style={{ color: 'var(--color-foreground)' }}>HRMS</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-foreground)' }}>Manager Sign In</h1>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Access your team management dashboard</p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl text-sm flex items-start gap-2"
              style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid hsl(0 50% 25%)' }}>
              <span className="flex-shrink-0 mt-0.5">⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-foreground)' }}>
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-muted)' }} />
                <input
                  id="manager-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="manager@company.com"
                  className="input-base pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-foreground)' }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-muted)' }} />
                <input
                  id="manager-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-base pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-80"
                  style={{ color: 'var(--color-muted)' }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="manager-login-btn"
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 mt-2 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, hsl(262 60% 52%), hsl(224 75% 50%))' }}
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="mt-6 pt-5 flex items-center justify-center gap-4 text-sm"
            style={{ borderTop: '1px solid var(--color-border)' }}>
            <Link href="/employee/login" style={{ color: 'var(--color-muted)' }}
              className="hover:opacity-80 transition-opacity">Employee</Link>
            <span style={{ color: 'var(--color-border)' }}>·</span>
            <Link href="/admin/login" style={{ color: 'var(--color-muted)' }}
              className="hover:opacity-80 transition-opacity">Admin</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
