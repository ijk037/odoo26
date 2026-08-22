import { createClient } from '@/lib/supabase/server'
import { History, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { formatDate, formatWorkingHours } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Attendance History' }

export default async function AttendanceHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: records } = await supabase
    .from('attendance')
    .select('*')
    .eq('employee_id', user!.id)
    .order('date', { ascending: false })
    .limit(30)

  const totalDays    = records?.length ?? 0
  const presentDays  = records?.filter(r => r.check_in && r.check_out).length ?? 0
  const totalHours   = records?.reduce((s, r) => s + (r.working_hours ?? 0), 0) ?? 0

  type AttRecord = typeof records extends (infer T)[] | null ? T : never
  const statusIcon = (r: AttRecord) => {
    if (r.check_out) return <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
    if (r.check_in)  return <Clock className="w-4 h-4 animate-pulse-slow" style={{ color: 'var(--color-info)' }} />
    return <AlertCircle className="w-4 h-4" style={{ color: 'var(--color-danger)' }} />
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Attendance History</h1>
        <p>Your last 30 days of attendance records.</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <span className="label">Days Present</span>
          <span className="value" style={{ color: 'var(--color-success)' }}>{presentDays}</span>
        </div>
        <div className="stat-card">
          <span className="label">Total Records</span>
          <span className="value" style={{ color: 'var(--color-brand-400)' }}>{totalDays}</span>
        </div>
        <div className="stat-card">
          <span className="label">Total Hours</span>
          <span className="value" style={{ color: 'var(--color-warning)' }}>{formatWorkingHours(totalHours)}</span>
        </div>
      </div>

      <div className="card">
        {records && records.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th><th>Status</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Distance</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id}>
                    <td className="font-medium">{formatDate(r.date)}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        {statusIcon(r)}
                        <span className="text-xs font-medium" style={{
                          color: r.check_out ? 'var(--color-success)' :
                                 r.check_in  ? 'var(--color-info)'    : 'var(--color-danger)'
                        }}>
                          {r.check_out ? 'Complete' : r.check_in ? 'Checked In' : 'Absent'}
                        </span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--color-muted)' }}>
                      {r.check_in ? new Date(r.check_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td style={{ color: 'var(--color-muted)' }}>
                      {r.check_out ? new Date(r.check_out).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td style={{ color: 'var(--color-foreground)' }}>
                      {r.working_hours ? formatWorkingHours(r.working_hours) : '—'}
                    </td>
                    <td style={{ color: 'var(--color-muted)' }}>
                      {r.check_in_distance ? `${r.check_in_distance}m` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center py-12" style={{ color: 'var(--color-muted)' }}>
            <History className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">No attendance records yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
