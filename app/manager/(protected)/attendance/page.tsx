'use client'

import { useState, useEffect } from 'react'
import { Calendar, Search, Clock, CheckCircle2, AlertCircle, Loader2, ClipboardList, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import { getTodayDate, formatDate, formatWorkingHours } from '@/lib/utils'

interface AttendanceRecord {
  id: string
  date: string
  check_in: string | null
  check_out: string | null
  working_hours: number | null
  check_in_distance: number | null
  work_completed: string | null
  employee: { id: string; full_name: string | null; email: string; department: string | null; profile_photo: string | null } | null
  task: { title: string; priority: string; status: string } | null
}

interface AISummary {
  headline: string
  highlights: string[]
  concerns: string[]
  recommendation: string
}

export default function ManagerAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [date, setDate]       = useState(getTodayDate())
  const [search, setSearch]   = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError]     = useState('')


  useEffect(() => { load() }, [date])

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/admin/attendance?date=${date}`)
    const { data } = await res.json()
    setRecords(data ?? [])
    setLoading(false)
  }

  const filtered = records.filter(r =>
    !search || r.employee?.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  async function generateAISummary() {
    const withReports = filtered.filter(r => r.work_completed)
    if (!withReports.length) { setAiError('No work reports available yet. Ask employees to check out first.'); return }
    setAiLoading(true)
    setAiError('')
    setAiSummary(null)
    const reports = withReports.map(r => ({
      employeeName: r.employee?.full_name ?? 'Employee',
      task: r.task?.title ?? 'General work',
      workCompleted: r.work_completed ?? '',
      hours: r.working_hours ?? undefined,
    }))
    const res = await fetch('/api/ai/work-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, reports }),
    })
    const result = await res.json()
    setAiLoading(false)
    if (!res.ok) { setAiError(result.error); return }
    setAiSummary(result.data)
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Team Attendance</h1>
        <p>Track your team&apos;s daily check-in/check-out.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <span className="label">Total Team</span>
          <span className="value" style={{ color: 'var(--color-brand-400)' }}>{filtered.length}</span>
        </div>
        <div className="stat-card">
          <span className="label">Present</span>
          <span className="value" style={{ color: 'var(--color-success)' }}>
            {filtered.filter(r => r.check_in).length}
          </span>
        </div>
        <div className="stat-card">
          <span className="label">Absent</span>
          <span className="value" style={{ color: 'var(--color-danger)' }}>
            {filtered.filter(r => !r.check_in).length}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-muted)' }} />
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-base pl-10 w-auto" />
        </div>
        <button onClick={() => setDate(getTodayDate())} className="btn btn-secondary text-sm px-3 py-2">Today</button>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search team member..." className="input-base pl-10" />
        </div>
      </div>

      {/* AI Summary */}
      <div className="mb-5">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'hsl(262 60% 55% / 0.1)', border: '1px solid hsl(262 60% 55% / 0.3)' }}>
          <Sparkles className="w-5 h-5 flex-shrink-0" style={{ color: 'hsl(262 60% 65%)' }} />
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: 'hsl(262 60% 70%)' }}>AI Team Summary</p>
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
              Gemini analyses work reports and gives you a performance snapshot for {formatDate(date)}
            </p>
            {aiError && <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>{aiError}</p>}
          </div>
          <button onClick={generateAISummary} disabled={aiLoading}
            className="btn btn-secondary text-sm px-4 py-2 flex-shrink-0"
            style={{ border: '1px solid hsl(262 60% 55% / 0.4)', color: 'hsl(262 60% 65%)' }}>
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {aiLoading ? 'Analysing...' : 'Generate'}
          </button>
        </div>

        {aiSummary && (
          <div className="mt-3 p-4 rounded-xl space-y-3"
            style={{ background: 'hsl(262 60% 10% / 0.6)', border: '1px solid hsl(262 60% 30%)' }}>
            <p className="font-semibold text-sm" style={{ color: 'hsl(262 60% 80%)' }}>{aiSummary.headline}</p>
            {aiSummary.highlights.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--color-success)' }}>Highlights</p>
                <ul className="space-y-1">
                  {aiSummary.highlights.map((h, i) => (
                    <li key={i} className="text-xs flex items-start gap-2" style={{ color: 'var(--color-foreground)' }}>
                      <span style={{ color: 'var(--color-success)' }}>✓</span>{h}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {aiSummary.concerns.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--color-warning)' }}>Attention Needed</p>
                <ul className="space-y-1">
                  {aiSummary.concerns.map((c, i) => (
                    <li key={i} className="text-xs flex items-start gap-2" style={{ color: 'var(--color-foreground)' }}>
                      <span style={{ color: 'var(--color-warning)' }}>⚠</span>{c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="pt-2" style={{ borderTop: '1px solid hsl(262 60% 25%)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--color-info)' }}>Tomorrow&apos;s Recommendation</p>
              <p className="text-xs" style={{ color: 'var(--color-foreground)' }}>{aiSummary.recommendation}</p>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--color-brand-400)' }} />
        </div>

      ) : (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="card flex flex-col items-center py-12" style={{ color: 'var(--color-muted)' }}>
              <Calendar className="w-10 h-10 mb-3 opacity-30" />
              <p>No records for {formatDate(date)}.</p>
            </div>
          ) : (
            filtered.map(r => (
              <div key={r.id} className="card card-hover cursor-pointer" onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, hsl(262 60% 55%), hsl(224 75% 50%))' }}>
                    {r.employee?.profile_photo
                      ? <img src={r.employee.profile_photo} alt="" className="w-full h-full object-cover" />
                      : (r.employee?.full_name?.[0] ?? '?').toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm" style={{ color: 'var(--color-foreground)' }}>
                        {r.employee?.full_name ?? '—'}
                      </p>
                      <div className="flex items-center gap-2">
                        {r.task && (
                          <span className={`badge ${
                            r.task.status === 'completed' ? 'badge-success' :
                            r.task.status === 'in_progress' ? 'badge-info' : 'badge-neutral'
                          } text-xs`}>{r.task.status.replace('_', ' ')}</span>
                        )}
                        {r.check_out
                          ? <span className="badge badge-success"><CheckCircle2 className="w-3 h-3" /> Done</span>
                          : r.check_in
                            ? <span className="badge badge-info animate-pulse-slow"><Clock className="w-3 h-3" /> In Office</span>
                            : <span className="badge badge-danger"><AlertCircle className="w-3 h-3" /> Absent</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                        In: {r.check_in
                          ? new Date(r.check_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                          : '—'}
                        {' · '}
                        Out: {r.check_out
                          ? new Date(r.check_out).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                          : '—'}
                        {r.working_hours ? ` · ${formatWorkingHours(r.working_hours)}` : ''}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Expanded: Work report + task */}
                {expanded === r.id && (
                  <div className="mt-4 pt-4 space-y-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                    {r.task && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--color-muted)' }}>
                          <ClipboardList className="inline w-3 h-3 mr-1" />Today&apos;s Task
                        </p>
                        <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>{r.task.title}</p>
                      </div>
                    )}
                    {r.work_completed && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--color-muted)' }}>Work Report</p>
                        <p className="text-sm" style={{ color: 'var(--color-foreground)' }}>{r.work_completed}</p>
                      </div>
                    )}
                    {!r.work_completed && !r.task && (
                      <p className="text-sm" style={{ color: 'var(--color-muted)' }}>No additional details.</p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
