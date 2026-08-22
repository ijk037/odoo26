'use client'

import { useState, useEffect } from 'react'
import { Calendar, Search, Download, Clock, CheckCircle2, AlertCircle, Loader2, Filter } from 'lucide-react'
import { getTodayDate, formatDate, formatWorkingHours } from '@/lib/utils'

interface AttendanceRecord {
  id: string
  date: string
  check_in: string | null
  check_out: string | null
  working_hours: number | null
  check_in_distance: number | null
  status: string
  work_completed: string | null
  employee: {
    id: string
    full_name: string | null
    email: string
    department: string | null
    designation: string | null
  } | null
  task: { title: string; priority: string; status: string } | null
}

export default function AdminAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [date, setDate]       = useState(getTodayDate())
  const [search, setSearch]   = useState('')

  useEffect(() => { load() }, [date])

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/admin/attendance?date=${date}`)
    const { data } = await res.json()
    setRecords(data ?? [])
    setLoading(false)
  }

  const filtered = records.filter(r =>
    !search ||
    r.employee?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.employee?.email?.includes(search) ||
    r.employee?.department?.toLowerCase().includes(search.toLowerCase())
  )

  const present   = filtered.filter(r => r.check_in && r.check_out).length
  const checkedIn = filtered.filter(r => r.check_in && !r.check_out).length
  const avgHours  = filtered.length
    ? filtered.reduce((s, r) => s + (r.working_hours ?? 0), 0) / filtered.filter(r => r.working_hours).length || 0
    : 0

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Attendance Overview</h1>
        <p>Monitor employee check-in/check-out and working hours.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <span className="label">Total Records</span>
          <span className="value" style={{ color: 'var(--color-brand-400)' }}>{filtered.length}</span>
        </div>
        <div className="stat-card">
          <span className="label">Fully Present</span>
          <span className="value" style={{ color: 'var(--color-success)' }}>{present}</span>
        </div>
        <div className="stat-card">
          <span className="label">Still In Office</span>
          <span className="value" style={{ color: 'var(--color-info)' }}>{checkedIn}</span>
        </div>
        <div className="stat-card">
          <span className="label">Avg Hours</span>
          <span className="value" style={{ color: 'var(--color-warning)' }}>{formatWorkingHours(avgHours)}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-muted)' }} />
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="input-base pl-10 w-auto" />
        </div>
        <button onClick={() => setDate(getTodayDate())} className="btn btn-secondary text-sm px-3 py-2">Today</button>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, department..." className="input-base pl-10" />
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--color-brand-400)' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-14" style={{ color: 'var(--color-muted)' }}>
            <Calendar className="w-10 h-10 mb-3 opacity-30" />
            <p>No attendance records for {formatDate(date)}.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Employee</th><th>Department</th><th>Check In</th><th>Check Out</th>
                  <th>Hours</th><th>Distance</th><th>Task</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td>
                      <p className="font-medium text-sm" style={{ color: 'var(--color-foreground)' }}>
                        {r.employee?.full_name ?? '—'}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{r.employee?.email}</p>
                    </td>
                    <td>
                      {r.employee?.department
                        ? <span className="badge badge-info">{r.employee.department}</span>
                        : '—'}
                    </td>
                    <td className="text-sm font-mono" style={{ color: 'var(--color-foreground)' }}>
                      {r.check_in ? new Date(r.check_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="text-sm font-mono" style={{ color: 'var(--color-foreground)' }}>
                      {r.check_out ? new Date(r.check_out).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="text-sm" style={{ color: 'var(--color-foreground)' }}>
                      {formatWorkingHours(r.working_hours)}
                    </td>
                    <td className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      {r.check_in_distance != null ? `${r.check_in_distance}m` : '—'}
                    </td>
                    <td className="max-w-[180px]">
                      {r.task ? (
                        <div>
                          <p className="text-xs font-medium truncate" style={{ color: 'var(--color-foreground)' }}>{r.task.title}</p>
                          <span className={`badge ${
                            r.task.priority === 'HIGH' ? 'badge-danger' :
                            r.task.priority === 'MEDIUM' ? 'badge-warning' : 'badge-info'
                          } mt-0.5`}>{r.task.priority}</span>
                        </div>
                      ) : <span style={{ color: 'var(--color-muted)' }}>—</span>}
                    </td>
                    <td>
                      {r.check_out
                        ? <span className="badge badge-success"><CheckCircle2 className="w-3 h-3" /> Complete</span>
                        : r.check_in
                          ? <span className="badge badge-info"><Clock className="w-3 h-3" /> In Office</span>
                          : <span className="badge badge-danger"><AlertCircle className="w-3 h-3" /> Absent</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Work Reports */}
      {filtered.some(r => r.work_completed) && (
        <div className="card mt-5">
          <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--color-foreground)' }}>Work Reports</h2>
          <div className="space-y-3">
            {filtered.filter(r => r.work_completed).map(r => (
              <div key={r.id} className="p-3 rounded-xl" style={{ background: 'var(--color-surface-2)' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-muted)' }}>
                  {r.employee?.full_name} · {r.employee?.department}
                </p>
                <p className="text-sm" style={{ color: 'var(--color-foreground)' }}>{r.work_completed}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
