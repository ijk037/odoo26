import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Shield, Briefcase, UserCircle, QrCode, MapPin, ClipboardCheck,
  BarChart3, Sparkles, ArrowRight, CheckCircle2, Clock, Lock
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'HRMS — Human Resource Management System',
  description: 'Workflow-driven Human Resource Management System. AI-powered, GPS-verified attendance, and complete employee lifecycle management.',
}

const FEATURES = [
  { icon: ClipboardCheck, title: 'Profile Verification',     desc: 'Structured employee onboarding with admin review and approval workflow.',      color: 'hsl(224 75% 60%)' },
  { icon: QrCode,         title: 'QR Check-In/Out',          desc: 'Employees scan rotating QR codes at office. GPS verified server-side.',          color: 'hsl(142 60% 45%)' },
  { icon: MapPin,         title: 'GPS Validation',           desc: 'Haversine formula validates presence within 100m of campus — unbeatable.',       color: 'hsl(38 90% 55%)'  },
  { icon: BarChart3,      title: 'Real-Time Dashboard',      desc: 'Live attendance stats, task tracking, and payroll overview for all roles.',      color: 'hsl(262 60% 60%)' },
  { icon: Sparkles,       title: 'AI-Powered Tasks',         desc: 'Gemini AI suggests daily tasks and summarises team work reports instantly.',     color: 'hsl(300 60% 60%)' },
  { icon: Lock,           title: 'Role-Based Security',      desc: 'Admin, Manager, Employee portals with server-side auth guards on every route.',  color: 'hsl(0 70% 55%)'   },
]

const WORKFLOW = [
  'Employee signs up',
  'Completes profile',
  'Admin reviews & approves',
  'Admin assigns manager',
  'Manager assigns daily task',
  'Employee scans office QR',
  'GPS validates location',
  'Employee checks in',
  'Employee works on task',
  'Employee checks out with report',
]

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background)' }}>
      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, hsl(224 75% 50%), transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, hsl(262 60% 55%), transparent 70%)', filter: 'blur(40px)' }} />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 glass" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, hsl(224 75% 50%), hsl(262 60% 55%))' }}>
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm" style={{ color: 'var(--color-foreground)' }}>HRMS</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/login"    className="btn btn-ghost text-xs px-3 py-2">Admin</Link>
            <Link href="/manager/login"  className="btn btn-ghost text-xs px-3 py-2">Manager</Link>
            <Link href="/employee/login" className="btn btn-primary text-sm px-4 py-2">Employee Login</Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-6 animate-fade-in"
            style={{ background: 'hsl(262 60% 55% / 0.15)', color: 'hsl(262 60% 70%)', border: '1px solid hsl(262 60% 55% / 0.3)' }}>
            <Sparkles className="w-3.5 h-3.5" /> AI-Powered · GPS-Verified · Role-Based
          </div>

          <h1 className="text-6xl font-extrabold tracking-tight mb-6 animate-fade-in" style={{ color: 'var(--color-foreground)', lineHeight: 1.1 }}>
            Workflow-Driven<br />
            <span style={{
              background: 'linear-gradient(135deg, hsl(224 80% 65%), hsl(262 70% 70%))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
            }}>HR Management</span>
          </h1>

          <p className="text-xl max-w-2xl mx-auto mb-10 animate-fade-in" style={{ color: 'var(--color-muted)', lineHeight: 1.7 }}>
            From employee onboarding to GPS-verified attendance — a complete, AI-assisted
            HR management system for modern organisations.
          </p>

          <div className="flex items-center justify-center gap-4 animate-fade-in">
            <Link href="/employee/signup" className="btn btn-primary px-8 py-3 text-base">
              Get Started <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/admin/login" className="btn btn-secondary px-8 py-3 text-base">
              Admin Portal <Shield className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* Workflow strip */}
        <section className="py-12 overflow-hidden" style={{ borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
          <div className="max-w-6xl mx-auto px-6">
            <p className="text-xs font-semibold uppercase tracking-widest mb-6 text-center" style={{ color: 'var(--color-muted)' }}>
              Complete Business Workflow
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {WORKFLOW.map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{ background: 'var(--color-surface-2)', color: 'var(--color-foreground)', border: '1px solid var(--color-border)' }}>
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, hsl(224 75% 50%), hsl(262 60% 55%))' }}>
                      {i + 1}
                    </span>
                    {step}
                  </div>
                  {i < WORKFLOW.length - 1 && (
                    <ArrowRight className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--color-muted)' }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3" style={{ color: 'var(--color-foreground)' }}>Everything You Need</h2>
            <p className="text-lg" style={{ color: 'var(--color-muted)' }}>A complete HR ecosystem in one platform</p>
          </div>
          <div className="grid grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="card card-hover p-6">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: `${color}20` }}>
                  <Icon className="w-6 h-6" style={{ color }} />
                </div>
                <h3 className="font-bold mb-2" style={{ color: 'var(--color-foreground)' }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Portals CTA */}
        <section className="max-w-6xl mx-auto px-6 pb-20">
          <div className="grid grid-cols-3 gap-5">
            {[
              { role: 'Admin',    href: '/admin/login',    Icon: Shield,      color: 'hsl(224 75% 55%)', desc: 'Verify profiles, manage payroll, approve leaves, generate QR codes' },
              { role: 'Manager',  href: '/manager/login',  Icon: Briefcase,   color: 'hsl(262 60% 60%)', desc: 'Assign daily tasks, track team attendance, view work reports'          },
              { role: 'Employee', href: '/employee/signup', Icon: UserCircle, color: 'hsl(142 60% 45%)', desc: 'Complete profile, scan QR, check in/out, apply for leave'               },
            ].map(({ role, href, Icon, color, desc }) => (
              <Link key={role} href={href} className="card card-hover p-6 block group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: `${color}20` }}>
                    <Icon className="w-6 h-6" style={{ color }} />
                  </div>
                  <div>
                    <h3 className="font-bold" style={{ color: 'var(--color-foreground)' }}>{role} Portal</h3>
                    <p className="text-xs" style={{ color }}>Sign in →</p>
                  </div>
                </div>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{desc}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8" style={{ borderTop: '1px solid var(--color-border)' }}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, hsl(224 75% 50%), hsl(262 60% 55%))' }}>
              <Shield className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>HRMS</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
            Human Resource Management System · Built with Next.js 16 + Supabase + Gemini AI
          </p>
        </div>
      </footer>
    </div>
  )
}
