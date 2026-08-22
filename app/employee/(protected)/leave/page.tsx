'use client'

import { useState, useEffect } from 'react'
import { Plus, Calendar, Loader2, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react'
import { formatDate, getTodayDate } from '@/lib/utils'
import type { LeaveRequest } from '@/types'

const LEAVE_TYPES = ['sick', 'casual', 'annual', 'unpaid'] as const

const STATUS_CFG = {
  pending:  { class: 'badge-warning', icon: Clock,         label: 'Pending'  },
  approved: { class: 'badge-success', icon: CheckCircle2,  label: 'Approved' },
  rejected: { class: 'badge-danger',  icon: XCircle,       label: 'Rejected' },
}

export default function EmployeeLeavePage() {
  const [leaves, setLeaves]     = useState<LeaveRequest[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')

  const [leaveType, setLeaveType] = useState<typeof LEAVE_TYPES[number]>('casual')
  const [startDate, setStartDate] = useState(getTodayDate())
  const [endDate, setEndDate]     = useState(getTodayDate())
  const [reason, setReason]       = useState('')

  useEffect(() => { loadLeaves() }, [])

  async function loadLeaves() {
    const res = await fetch('/api/leave')
    const { data } = await res.json()
    setLeaves(data ?? [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    const res = await fetch('/api/leave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leaveType, startDate, endDate, reason }),
    })
    const result = await res.json()
    setSubmitting(false)
    if (!res.ok) { setError(result.error); return }
    setSuccess('Leave request submitted successfully.')
    setShowForm(false)
    setReason('')
    await loadLeaves()
  }

  const days = (s: string, e: string) => {
    const d = Math.ceil((new Date(e).getTime() - new Date(s).getTime()) / 86_400_000) + 1
    return d > 0 ? d : 1
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-brand-400)' }} />
    </div>
  )

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="flex items-start justify-between mb-6">
        <div className="page-header mb-0">
          <h1>Leave Requests</h1>
          <p>Request time off and track your leave status.</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setError(''); setSuccess('') }}
          className="btn btn-primary flex-shrink-0">
          <Plus className="w-4 h-4" /> {showForm ? 'Cancel' : 'New Request'}
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {(['pending', 'approved', 'rejected'] as const).map(s => {
          const count = leaves.filter(l => l.status === s).length
          const cfg = STATUS_CFG[s]
          return (
            <div key={s} className="stat-card">
              <span className="label">{cfg.label}</span>
              <span className="value" style={{
                color: s === 'approved' ? 'var(--color-success)' :
                       s === 'rejected' ? 'var(--color-danger)' : 'var(--color-warning)'
              }}>{count}</span>
            </div>
          )
        })}
      </div>

      {/* Success message */}
      {success && (
        <div className="mb-5 px-4 py-3 rounded-xl flex items-center gap-3"
          style={{ background: 'var(--color-success-bg)', border: '1px solid hsl(142 50% 20%)', color: 'var(--color-success)' }}>
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium">{success}</span>
        </div>
      )}

      {/* New request form */}
      {showForm && (
        <div className="card mb-6" style={{ border: '1px solid var(--color-brand-400)33' }}>
          <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--color-foreground)' }}>
            New Leave Request
          </h2>
          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm"
              style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid hsl(0 50% 25%)' }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Leave Type */}
            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>Leave Type *</label>
              <div className="flex gap-2 flex-wrap">
                {LEAVE_TYPES.map(type => (
                  <button key={type} type="button" onClick={() => setLeaveType(type)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all"
                    style={{
                      background: leaveType === type ? 'hsl(224 75% 50% / 0.2)' : 'var(--color-surface-2)',
                      color: leaveType === type ? 'var(--color-brand-400)' : 'var(--color-muted)',
                      border: `2px solid ${leaveType === type ? 'var(--color-brand-400)' : 'var(--color-border)'}`,
                    }}>
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>Start Date *</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  min={getTodayDate()} required className="input-base" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>End Date *</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                  min={startDate} required className="input-base" />
              </div>
            </div>

            {startDate && endDate && (
              <div className="px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--color-surface-2)', color: 'var(--color-muted)' }}>
                Duration: <strong style={{ color: 'var(--color-foreground)' }}>{days(startDate, endDate)} day{days(startDate, endDate) !== 1 ? 's' : ''}</strong>
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>Reason *</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)}
                placeholder="Please provide a reason for your leave request..." rows={3}
                required className="input-base resize-none" />
            </div>

            <button type="submit" disabled={submitting} className="btn btn-primary w-full">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
              Submit Leave Request
            </button>
          </form>
        </div>
      )}

      {/* Leave History */}
      <div className="space-y-3">
        {leaves.length === 0 ? (
          <div className="card flex flex-col items-center py-12" style={{ color: 'var(--color-muted)' }}>
            <Calendar className="w-10 h-10 mb-3 opacity-30" />
            <p>No leave requests yet.</p>
          </div>
        ) : (
          leaves.map(leave => {
            const cfg = STATUS_CFG[leave.status]
            const Icon = cfg.icon
            return (
              <div key={leave.id} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold capitalize" style={{ color: 'var(--color-foreground)' }}>
                        {leave.leave_type} Leave
                      </span>
                      <span className={`badge ${cfg.class}`}>
                        <Icon className="w-3 h-3" /> {cfg.label}
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                      {formatDate(leave.start_date)} → {formatDate(leave.end_date)} ·
                      {' '}{days(leave.start_date, leave.end_date)} day{days(leave.start_date, leave.end_date) !== 1 ? 's' : ''}
                    </p>
                    <p className="text-sm mt-2" style={{ color: 'var(--color-foreground)' }}>{leave.reason}</p>
                  </div>
                  <span className="text-xs flex-shrink-0" style={{ color: 'var(--color-muted)' }}>
                    {formatDate(leave.created_at)}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
