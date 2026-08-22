'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, Clock, Loader2, Calendar, AlertCircle, User } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface LeaveRow {
  id: string
  leave_type: string
  start_date: string
  end_date: string
  reason: string
  status: string
  created_at: string
  reviewed_at: string | null
  employee: {
    id: string
    full_name: string | null
    email: string
    department: string | null
    designation: string | null
  } | null
}

const STATUS_CFG = {
  pending:  { class: 'badge-warning', label: 'Pending'  },
  approved: { class: 'badge-success', label: 'Approved' },
  rejected: { class: 'badge-danger',  label: 'Rejected' },
}

const days = (s: string, e: string) =>
  Math.ceil((new Date(e).getTime() - new Date(s).getTime()) / 86_400_000) + 1

export default function AdminLeavePage() {
  const [leaves, setLeaves] = useState<LeaveRow[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing]   = useState<string | null>(null)
  const [toast, setToast]     = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [filter, setFilter]   = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')

  useEffect(() => { load() }, [])

  async function load() {
    const res = await fetch('/api/leave/review')
    const { data } = await res.json()
    setLeaves(data ?? [])
    setLoading(false)
  }

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3500)
  }

  async function handleAction(leaveId: string, action: 'approved' | 'rejected') {
    setActing(leaveId)
    const res = await fetch('/api/leave/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leaveId, action }),
    })
    const result = await res.json()
    setActing(null)
    if (!res.ok) { showToast('error', result.error); return }
    showToast('success', result.message)
    await load()
  }

  const filtered = filter === 'all' ? leaves : leaves.filter(l => l.status === filter)

  const pending  = leaves.filter(l => l.status === 'pending').length
  const approved = leaves.filter(l => l.status === 'approved').length
  const rejected = leaves.filter(l => l.status === 'rejected').length

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-brand-400)' }} />
    </div>
  )

  return (
    <div className="animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl animate-fade-in"
          style={{
            background: toast.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
            border: `1px solid ${toast.type === 'success' ? 'hsl(142 50% 20%)' : 'hsl(0 50% 25%)'}`,
            color: toast.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
          }}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <div className="page-header">
        <h1>Leave Requests</h1>
        <p>Review and approve employee leave applications.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', count: leaves.length, color: 'var(--color-brand-400)', key: 'all' },
          { label: 'Pending', count: pending,   color: 'var(--color-warning)', key: 'pending'  },
          { label: 'Approved', count: approved, color: 'var(--color-success)', key: 'approved' },
          { label: 'Rejected', count: rejected, color: 'var(--color-danger)',  key: 'rejected' },
        ].map(({ label, count, color, key }) => (
          <div key={key} onClick={() => setFilter(key as typeof filter)}
            className="stat-card cursor-pointer transition-all"
            style={{
              border: filter === key ? `1px solid ${color}55` : '1px solid var(--color-border)',
              background: filter === key ? `${color}10` : 'var(--color-surface)',
            }}>
            <span className="label">{label}</span>
            <span className="value" style={{ color }}>{count}</span>
          </div>
        ))}
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="card flex flex-col items-center py-12" style={{ color: 'var(--color-muted)' }}>
            <Calendar className="w-10 h-10 mb-3 opacity-30" />
            <p>No {filter === 'all' ? '' : filter} leave requests.</p>
          </div>
        ) : (
          filtered.map(leave => {
            const cfg = STATUS_CFG[leave.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.pending
            const isPending = leave.status === 'pending'
            return (
              <div key={leave.id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Employee */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, hsl(262 60% 55%), hsl(224 75% 50%))' }}>
                        {(leave.employee?.full_name?.[0] ?? '?').toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: 'var(--color-foreground)' }}>
                          {leave.employee?.full_name ?? '—'}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                          {leave.employee?.department} · {leave.employee?.designation}
                        </p>
                      </div>
                    </div>

                    {/* Leave details */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="badge badge-info capitalize">{leave.leave_type} leave</span>
                      <span className={`badge ${cfg.class}`}>{cfg.label}</span>
                      <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                        {formatDate(leave.start_date)} → {formatDate(leave.end_date)} ·
                        {' '}<strong>{days(leave.start_date, leave.end_date)} day{days(leave.start_date, leave.end_date) !== 1 ? 's' : ''}</strong>
                      </span>
                    </div>

                    <p className="text-sm" style={{ color: 'var(--color-foreground)' }}>{leave.reason}</p>

                    <p className="text-xs mt-2" style={{ color: 'var(--color-muted)' }}>
                      Applied on {formatDate(leave.created_at)}
                      {leave.reviewed_at && ` · Reviewed on ${formatDate(leave.reviewed_at)}`}
                    </p>
                  </div>

                  {/* Actions */}
                  {isPending && (
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleAction(leave.id, 'approved')}
                        disabled={acting === leave.id}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                        style={{
                          background: 'var(--color-success-bg)',
                          color: 'var(--color-success)',
                          border: '1px solid hsl(142 50% 20%)',
                        }}>
                        {acting === leave.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <CheckCircle2 className="w-4 h-4" />}
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(leave.id, 'rejected')}
                        disabled={acting === leave.id}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                        style={{
                          background: 'var(--color-danger-bg)',
                          color: 'var(--color-danger)',
                          border: '1px solid hsl(0 50% 25%)',
                        }}>
                        {acting === leave.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <XCircle className="w-4 h-4" />}
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
