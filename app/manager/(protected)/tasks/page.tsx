'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Loader2, ClipboardList, Calendar, Users } from 'lucide-react'
import { getTodayDate, formatDate } from '@/lib/utils'
import type { DailyTask } from '@/types'

const PRIORITY_BADGE: Record<string, string> = {
  HIGH: 'badge-danger', MEDIUM: 'badge-warning', LOW: 'badge-info'
}

export default function ManagerTasksPage() {
  const [tasks, setTasks] = useState<DailyTask[]>([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(getTodayDate())

  useEffect(() => { loadTasks() }, [date])

  async function loadTasks() {
    setLoading(true)
    const res = await fetch(`/api/manager/tasks?date=${date}`)
    const { data } = await res.json()
    setTasks(data ?? [])
    setLoading(false)
  }

  const grouped = tasks.reduce<Record<string, DailyTask[]>>((acc, t) => {
    const empId = t.employee_id
    if (!acc[empId]) acc[empId] = []
    acc[empId].push(t)
    return acc
  }, {})

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <div className="page-header mb-0">
          <h1>Daily Tasks</h1>
          <p>Manage and track your team&apos;s daily assignments.</p>
        </div>
        <Link href="/manager/tasks/assign" className="btn btn-primary flex-shrink-0">
          <Plus className="w-4 h-4" /> Assign Task
        </Link>
      </div>

      {/* Date picker */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-muted)' }} />
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="input-base pl-10 w-auto" />
        </div>
        <button onClick={() => setDate(getTodayDate())} className="btn btn-secondary text-sm px-3 py-2">
          Today
        </button>
        <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
          {tasks.length} task{tasks.length !== 1 ? 's' : ''} on {formatDate(date)}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--color-brand-400)' }} />
        </div>
      ) : tasks.length === 0 ? (
        <div className="card flex flex-col items-center py-14" style={{ color: 'var(--color-muted)' }}>
          <ClipboardList className="w-12 h-12 mb-4 opacity-30" />
          <p className="font-medium text-lg">No tasks assigned for {formatDate(date)}</p>
          <p className="text-sm mt-1 mb-5">Assign tasks to keep your team productive.</p>
          <Link href="/manager/tasks/assign" className="btn btn-primary">
            <Plus className="w-4 h-4" /> Assign First Task
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map(task => {
            const emp = task.employee as unknown as { id: string; full_name: string | null; email: string; department: string | null; profile_photo: string | null } | null
            return (
              <div key={task.id} className="card card-hover">
                <div className="flex items-start gap-4">
                  {/* Employee avatar */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, hsl(262 60% 55%), hsl(224 75% 50%))' }}>
                    {emp?.profile_photo ? (
                      <img src={emp.profile_photo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      (emp?.full_name?.[0] ?? '?').toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--color-muted)' }}>
                          <Users className="inline w-3 h-3 mr-1" />
                          {emp?.full_name ?? emp?.email ?? '—'} · {emp?.department ?? ''}
                        </p>
                        <h3 className="font-semibold" style={{ color: 'var(--color-foreground)' }}>{task.title}</h3>
                        {task.description && (
                          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>{task.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`badge ${PRIORITY_BADGE[task.priority] ?? 'badge-neutral'}`}>{task.priority}</span>
                        <span className={`badge ${
                          task.status === 'completed' ? 'badge-success' :
                          task.status === 'in_progress' ? 'badge-info' : 'badge-neutral'
                        }`}>{task.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
