'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import {
  User, Phone, MapPin, Calendar, Building2, Briefcase,
  GraduationCap, CheckCircle2, XCircle, Loader2, ArrowLeft,
  MessageSquare, Clock, AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import type { Profile } from '@/types'
import { formatDate } from '@/lib/utils'

const STATUS_CONFIG = {
  draft:             { label: 'Draft',            class: 'badge-neutral' },
  pending:           { label: 'Pending Review',   class: 'badge-warning' },
  verified:          { label: 'Verified',         class: 'badge-success' },
  changes_requested: { label: 'Changes Requested', class: 'badge-danger' },
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'var(--color-muted)' }}>{label}</p>
      <p className="text-sm" style={{ color: value ? 'var(--color-foreground)' : 'var(--color-muted)' }}>{value ?? '—'}</p>
    </div>
  )
}

export default function VerifyProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading]   = useState(true)
  const [comment, setComment]   = useState('')
  const [action, setAction]     = useState<'approve' | 'request_changes' | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/admin/employee/${params.id}`)
      .then(r => r.json())
      .then(({ data }) => { setProfile(data); setLoading(false) })
  }, [params.id])

  async function handleSubmit() {
    if (!action) return
    if (action === 'request_changes' && !comment.trim()) {
      setError('Please provide feedback for the employee.')
      return
    }
    setSubmitting(true)
    setError('')
    const res = await fetch('/api/admin/verify-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId: params.id, action, comment }),
    })
    const result = await res.json()
    if (!res.ok) { setError(result.error); setSubmitting(false); return }
    router.push('/admin/verification')
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-brand-400)' }} />
    </div>
  )
  if (!profile) return <p>Employee not found.</p>

  const statusCfg = STATUS_CONFIG[profile.profile_status ?? 'draft']
  const canDecide = profile.profile_status === 'pending' || profile.profile_status === 'changes_requested'

  return (
    <div className="animate-fade-in max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/verification" className="btn btn-ghost p-2">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="page-header mb-0 flex-1">
          <h1>Review Profile</h1>
          <p>Verify employee information before approving.</p>
        </div>
        <span className={`badge ${statusCfg.class} text-sm px-3 py-1`}>{statusCfg.label}</span>
      </div>

      {/* Profile header card */}
      <div className="card mb-5">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0"
            style={{ background: 'var(--color-surface-2)', border: '2px solid var(--color-border)' }}>
            {profile.profile_photo ? (
              <img src={profile.profile_photo} alt={profile.full_name ?? ''} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold"
                style={{ background: 'linear-gradient(135deg, hsl(224 75% 50%), hsl(262 60% 55%))', color: 'white' }}>
                {(profile.full_name?.[0] ?? '?').toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--color-foreground)' }}>{profile.full_name ?? '—'}</h2>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{profile.email}</p>
            <div className="flex items-center gap-2 mt-2">
              {profile.department && <span className="badge badge-info">{profile.department}</span>}
              {profile.designation && <span className="badge badge-neutral">{profile.designation}</span>}
              {profile.employee_id && <span className="badge badge-neutral">ID: {profile.employee_id}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5 mb-5">
        {/* Personal */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <User className="w-4 h-4" style={{ color: 'var(--color-brand-400)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-foreground)' }}>Personal</h3>
          </div>
          <div className="space-y-3">
            <InfoRow label="Full Name" value={profile.full_name} />
            <InfoRow label="Date of Birth" value={profile.date_of_birth ? formatDate(profile.date_of_birth) : null} />
            <InfoRow label="Phone" value={profile.phone} />
            <InfoRow label="Address" value={profile.address} />
            <InfoRow label="Joining Date" value={profile.joining_date ? formatDate(profile.joining_date) : null} />
          </div>
        </div>

        {/* Skills + Education + Experience */}
        <div className="space-y-5">
          <div className="card">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-foreground)' }}>Skills</h3>
            {(profile.skills ?? []).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {(profile.skills ?? []).map(s => <span key={s} className="badge badge-brand">{s}</span>)}
              </div>
            ) : <p className="text-xs" style={{ color: 'var(--color-muted)' }}>None listed.</p>}
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="w-4 h-4" style={{ color: 'var(--color-brand-400)' }} />
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-foreground)' }}>Education</h3>
            </div>
            {(profile.education ?? []).length > 0 ? (
              <div className="space-y-2">
                {(profile.education ?? []).map((e, i) => (
                  <div key={i} className="text-sm">
                    <p className="font-medium" style={{ color: 'var(--color-foreground)' }}>{e.degree}</p>
                    <p style={{ color: 'var(--color-muted)' }}>{e.institution} · {e.year}{e.grade ? ` · ${e.grade}` : ''}</p>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs" style={{ color: 'var(--color-muted)' }}>None listed.</p>}
          </div>
        </div>
      </div>

      {/* Experience */}
      {(profile.experience ?? []).length > 0 && (
        <div className="card mb-5">
          <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <Briefcase className="w-4 h-4" style={{ color: 'var(--color-brand-400)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-foreground)' }}>Experience</h3>
          </div>
          <div className="space-y-3">
            {(profile.experience ?? []).map((e, i) => (
              <div key={i} className="p-3 rounded-lg" style={{ background: 'var(--color-surface-2)' }}>
                <p className="font-medium text-sm" style={{ color: 'var(--color-foreground)' }}>{e.title} @ {e.company}</p>
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{e.start_year} — {e.end_year}</p>
                {e.description && <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>{e.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Decision panel */}
      {canDecide && (
        <div className="card" style={{ border: '1px solid var(--color-brand-400)33' }}>
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--color-foreground)' }}>Admin Decision</h3>

          <div className="flex gap-3 mb-4">
            <button onClick={() => setAction('approve')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${action === 'approve' ? 'ring-2' : ''}`}
              style={{
                background: action === 'approve' ? 'var(--color-success-bg)' : 'var(--color-surface-2)',
                color: action === 'approve' ? 'var(--color-success)' : 'var(--color-muted)',
                border: `2px solid ${action === 'approve' ? 'var(--color-success)' : 'var(--color-border)'}`,
              }}>
              <CheckCircle2 className="w-5 h-5" /> Approve Profile
            </button>
            <button onClick={() => setAction('request_changes')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all`}
              style={{
                background: action === 'request_changes' ? 'var(--color-danger-bg)' : 'var(--color-surface-2)',
                color: action === 'request_changes' ? 'var(--color-danger)' : 'var(--color-muted)',
                border: `2px solid ${action === 'request_changes' ? 'var(--color-danger)' : 'var(--color-border)'}`,
              }}>
              <XCircle className="w-5 h-5" /> Request Changes
            </button>
          </div>

          {action === 'request_changes' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-foreground)' }}>
                <MessageSquare className="inline w-4 h-4 mr-1" />
                Feedback for Employee *
              </label>
              <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
                placeholder="Describe what needs to be corrected (e.g. 'Please upload a clearer profile photo and fill in your department')"
                className="input-base resize-none" />
            </div>
          )}

          {error && <p className="text-sm mb-3" style={{ color: 'var(--color-danger)' }}>{error}</p>}

          {action && (
            <button onClick={handleSubmit} disabled={submitting} className="btn btn-primary w-full">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {action === 'approve' ? 'Confirm Approval' : 'Send Change Request'}
            </button>
          )}
        </div>
      )}

      {!canDecide && profile.profile_status === 'verified' && (
        <div className="card flex items-center gap-3" style={{ background: 'var(--color-success-bg)', border: '1px solid hsl(142 50% 20%)' }}>
          <CheckCircle2 className="w-6 h-6" style={{ color: 'var(--color-success)' }} />
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--color-success)' }}>Profile Verified</p>
            {profile.verified_at && <p className="text-xs" style={{ color: 'var(--color-muted)' }}>on {formatDate(profile.verified_at)}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
