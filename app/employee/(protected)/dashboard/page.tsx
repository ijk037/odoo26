import { createClient } from '@/lib/supabase/server'
import { QrCode, ClipboardList, Calendar, DollarSign, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import Link from 'next/link'
import { getTodayDate, formatDate, formatWorkingHours } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Employee Dashboard' }

export default async function EmployeeDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const today = getTodayDate()

  const [
    { data: profile },
    { data: todayTask },
    { data: todayAttendance },
    { data: pendingLeave },
  ] = await Promise.all([
    supabase.from('profiles').select('full_name, profile_status, department, designation, manager_id').eq('id', user!.id).single(),
    supabase.from('daily_tasks').select('id, title, description, priority, status').eq('employee_id', user!.id).eq('task_date', today).maybeSingle(),
    supabase.from('attendance').select('check_in, check_out, working_hours, status').eq('employee_id', user!.id).eq('date', today).maybeSingle(),
    supabase.from('leave_requests').select('id', { count: 'exact', head: true }).eq('employee_id', user!.id).eq('status', 'pending'),
  ])

  const isCheckedIn  = !!todayAttendance?.check_in
  const isCheckedOut = !!todayAttendance?.check_out

  const statusConfig: Record<string, { label: string; class: string }> = {
    draft:             { label: 'Profile Draft',      class: 'badge-neutral' },
    pending:           { label: 'Under Review',       class: 'badge-warning' },
    verified:          { label: 'Profile Verified',   class: 'badge-success' },
    changes_requested: { label: 'Changes Requested',  class: 'badge-danger'  },
  }
  const profileStatus = statusConfig[profile?.profile_status ?? 'draft']

  const priorityColors: Record<string, string> = {
    HIGH: 'badge-danger', MEDIUM: 'badge-warning', LOW: 'badge-info'
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Welcome, {profile?.full_name?.split(' ')[0] ?? 'Employee'} 👋</h1>
        <p>{formatDate(today)} — {profile?.designation ?? profile?.department ?? 'MUJ HRMS'}</p>
      </div>

      {/* Profile status alert */}
      {profile?.profile_status !== 'verified' && (
        <div className="mb-6 px-4 py-3.5 rounded-xl flex items-center gap-3"
          style={{ background: 'var(--color-warning-bg)', border: '1px solid hsl(38 60% 25%)' }}>
          <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-warning)' }} />
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: 'var(--color-warning)' }}>
              {profile?.profile_status === 'draft' ? 'Complete your profile to get started' :
               profile?.profile_status === 'pending' ? 'Profile is under admin review' :
               'Admin has requested profile changes'}
            </p>
          </div>
          <Link href="/employee/profile" className="btn btn-secondary text-xs px-3 py-1.5">
            {profile?.profile_status === 'draft' ? 'Complete Profile' : 'View Profile'}
          </Link>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Today's attendance */}
        <div className="col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold" style={{ color: 'var(--color-foreground)' }}>Today&apos;s Attendance</h2>
            <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{formatDate(today)}</span>
          </div>

          {isCheckedOut ? (
            <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'var(--color-success-bg)', border: '1px solid hsl(142 50% 20%)' }}>
              <CheckCircle2 className="w-8 h-8" style={{ color: 'var(--color-success)' }} />
              <div>
                <p className="font-semibold" style={{ color: 'var(--color-success)' }}>Attendance Complete</p>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                  Worked {formatWorkingHours(todayAttendance?.working_hours)} today
                </p>
              </div>
            </div>
          ) : isCheckedIn ? (
            <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'var(--color-info-bg)', border: '1px solid hsl(200 50% 20%)' }}>
              <Clock className="w-8 h-8 animate-pulse-slow" style={{ color: 'var(--color-info)' }} />
              <div className="flex-1">
                <p className="font-semibold" style={{ color: 'var(--color-info)' }}>Currently Checked In</p>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                  Since {new Date(todayAttendance!.check_in!).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <Link href="/employee/attendance" className="btn btn-primary text-xs px-3 py-1.5">Check Out</Link>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="p-5 rounded-2xl" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                <QrCode className="w-12 h-12" style={{ color: 'var(--color-brand-400)' }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>Not checked in yet</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>Scan the company QR code to mark attendance</p>
              </div>
              <Link href="/employee/attendance" className="btn btn-primary">
                <QrCode className="w-4 h-4" /> Go to Attendance
              </Link>
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="flex flex-col gap-4">
          <div className="stat-card">
            <span className="label">Profile Status</span>
            <span className={`badge ${profileStatus.class} mt-1`}>{profileStatus.label}</span>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4" style={{ color: 'var(--color-warning)' }} />
              <span className="label">Leave Pending</span>
            </div>
            <Link href="/employee/leave" className="text-xl font-bold" style={{ color: 'var(--color-warning)' }}>
              {(pendingLeave as unknown as { count: number })?.count ?? 0}
            </Link>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
              <span className="label">Salary</span>
            </div>
            <Link href="/employee/salary" className="text-sm font-medium" style={{ color: 'var(--color-success)' }}>
              View →
            </Link>
          </div>
        </div>
      </div>

      {/* Today's task */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" style={{ color: 'var(--color-brand-400)' }} />
            <h2 className="text-base font-semibold" style={{ color: 'var(--color-foreground)' }}>Today&apos;s Task</h2>
          </div>
        </div>

        {todayTask ? (
          <div className="p-4 rounded-xl" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="font-semibold" style={{ color: 'var(--color-foreground)' }}>{todayTask.title}</h3>
              <span className={`badge ${priorityColors[todayTask.priority] ?? 'badge-neutral'} flex-shrink-0`}>{todayTask.priority}</span>
            </div>
            {todayTask.description && (
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{todayTask.description}</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center py-8" style={{ color: 'var(--color-muted)' }}>
            <ClipboardList className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">No task assigned for today</p>
            <p className="text-xs mt-1">Your manager will assign a task shortly</p>
          </div>
        )}
      </div>
    </div>
  )
}
