import { createClient } from '@/lib/supabase/server'
import { Users, FileText, CheckSquare, Clock } from 'lucide-react'
import Link from 'next/link'
import { getTodayDate, formatDate } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Manager Dashboard' }

export default async function ManagerDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const today = getTodayDate()

  const [
    { count: myEmployees },
    { count: todayTasks },
    { data: recentEmployees },
    { data: todayTaskList },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true })
      .eq('manager_id', user!.id).eq('role', 'employee'),
    supabase.from('daily_tasks').select('*', { count: 'exact', head: true })
      .eq('manager_id', user!.id).eq('task_date', today),
    supabase.from('profiles').select('id, full_name, email, department, designation')
      .eq('manager_id', user!.id).eq('role', 'employee').limit(5),
    supabase.from('daily_tasks')
      .select('id, title, priority, status, task_date, employee:profiles!daily_tasks_employee_id_fkey(full_name)')
      .eq('manager_id', user!.id).eq('task_date', today).limit(5),
  ])

  const stats = [
    { label: 'My Employees',  value: myEmployees ?? 0,  icon: Users,       color: 'var(--color-brand-400)' },
    { label: "Today's Tasks", value: todayTasks ?? 0,   icon: FileText,    color: 'var(--color-warning)' },
  ]

  const priorityColors: Record<string, string> = {
    HIGH: 'badge-danger', MEDIUM: 'badge-warning', LOW: 'badge-info'
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Manager Dashboard</h1>
        <p>Manage your team and track daily task progress — {formatDate(today)}.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="stat-card">
              <div className="flex items-center justify-between">
                <span className="label">{s.label}</span>
                <Icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <span className="value" style={{ color: s.color }}>{s.value}</span>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* My employees */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold" style={{ color: 'var(--color-foreground)' }}>My Employees</h2>
            <Link href="/manager/employees" className="text-sm font-medium" style={{ color: 'var(--color-brand-400)' }}>View all →</Link>
          </div>
          {recentEmployees && recentEmployees.length > 0 ? (
            <div className="space-y-3">
              {recentEmployees.map((emp) => (
                <div key={emp.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--color-surface-2)' }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, hsl(262 60% 55%), hsl(224 75% 50%))' }}>
                    {(emp.full_name?.[0] ?? '?').toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--color-foreground)' }}>{emp.full_name ?? '—'}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--color-muted)' }}>{emp.designation ?? emp.department ?? emp.email}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8" style={{ color: 'var(--color-muted)' }}>
              <Users className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">No employees assigned yet</p>
            </div>
          )}
        </div>

        {/* Today's tasks */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold" style={{ color: 'var(--color-foreground)' }}>Today&apos;s Tasks</h2>
            <Link href="/manager/tasks/assign" className="btn btn-primary text-xs px-3 py-1.5">+ Assign Task</Link>
          </div>
          {todayTaskList && todayTaskList.length > 0 ? (
            <div className="space-y-3">
              {todayTaskList.map((task) => {
                const empRaw = task.employee
                const emp = Array.isArray(empRaw) ? empRaw[0] : empRaw as { full_name: string | null } | null
                return (
                  <div key={task.id} className="p-3 rounded-lg" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>{task.title}</p>
                      <span className={`badge ${priorityColors[task.priority] ?? 'badge-neutral'} flex-shrink-0`}>{task.priority}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Clock className="w-3 h-3" style={{ color: 'var(--color-muted)' }} />
                      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{emp?.full_name ?? '—'}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8" style={{ color: 'var(--color-muted)' }}>
              <CheckSquare className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">No tasks assigned today</p>
              <Link href="/manager/tasks/assign" className="mt-3 text-xs font-medium" style={{ color: 'var(--color-brand-400)' }}>
                Assign a task →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
