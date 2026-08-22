'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, ClipboardList, User, Calendar, AlertTriangle, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { getTodayDate } from '@/lib/utils'
import type { Profile } from '@/types'

const PRIORITIES = ['HIGH', 'MEDIUM', 'LOW'] as const

export default function AssignTaskPage() {
  const router = useRouter()
  const [employees, setEmployees] = useState<Profile[]>([])
  const [loading, setLoading]     = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [employeeId, setEmployeeId] = useState('')
  const [title, setTitle]           = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority]     = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM')
  const [taskDate, setTaskDate]     = useState(getTodayDate())
  const [aiLoading, setAiLoading]   = useState(false)
  const [aiError, setAiError]       = useState('')

  useEffect(() => {
    fetch('/api/manager/employees')
      .then(r => r.json())
      .then(({ data }) => { setEmployees(data ?? []); setLoading(false) })
  }, [])

  async function suggestWithAI() {
    if (!employeeId) { setAiError('Select an employee first.'); return }
    setAiLoading(true)
    setAiError('')
    const emp = employees.find(e => e.id === employeeId)
    const res = await fetch('/api/ai/task-suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeName: emp?.full_name ?? 'Employee',
        department:   emp?.department,
        designation:  emp?.designation,
      }),
    })
    const result = await res.json()
    setAiLoading(false)
    if (!res.ok) { setAiError(result.error); return }
    setTitle(result.data.title)
    setDescription(result.data.description)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!employeeId) { setError('Please select an employee.'); return }
    setSubmitting(true)
    setError('')

    const res = await fetch('/api/manager/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, title, description, priority, taskDate }),
    })
    const result = await res.json()
    if (!res.ok) { setError(result.error); setSubmitting(false); return }
    router.push('/manager/tasks')
  }

  const priorityConfig = {
    HIGH:   { color: 'var(--color-danger)',  bg: 'var(--color-danger-bg)'  },
    MEDIUM: { color: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
    LOW:    { color: 'var(--color-info)',    bg: 'var(--color-info-bg)'    },
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-brand-400)' }} />
    </div>
  )

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/manager/tasks" className="btn btn-ghost p-2">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="page-header mb-0">
          <h1>Assign Daily Task</h1>
          <p>Create and assign a task to one of your employees.</p>
        </div>
      </div>

      {employees.length === 0 ? (
        <div className="card flex flex-col items-center py-12" style={{ color: 'var(--color-muted)' }}>
          <AlertTriangle className="w-10 h-10 mb-3 opacity-40" />
          <p className="font-medium">No employees assigned to you yet.</p>
          <p className="text-sm mt-1">Ask an admin to assign employees to your team.</p>
        </div>
      ) : (
        <div className="card">
          {error && (
            <div className="mb-5 px-4 py-3 rounded-lg text-sm"
              style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid hsl(0 50% 25%)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Employee */}
            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
                <User className="inline w-3.5 h-3.5 mr-1" />Assign To *
              </label>
              <select value={employeeId} onChange={e => setEmployeeId(e.target.value)}
                required className="input-base" style={{ background: 'var(--color-surface-2)' }}>
                <option value="">— Select Employee —</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name ?? emp.email} {emp.department ? `(${emp.department})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Task Date */}
            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
                <Calendar className="inline w-3.5 h-3.5 mr-1" />Task Date *
              </label>
              <input type="date" value={taskDate} onChange={e => setTaskDate(e.target.value)}
                min={getTodayDate()} required className="input-base" />
            </div>

            {/* AI Suggest */}
            <div className="flex items-center gap-3 py-3 px-4 rounded-xl"
              style={{ background: 'hsl(262 60% 55% / 0.1)', border: '1px solid hsl(262 60% 55% / 0.3)' }}>
              <Sparkles className="w-5 h-5 flex-shrink-0" style={{ color: 'hsl(262 60% 65%)' }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'hsl(262 60% 70%)' }}>AI Task Suggestion</p>
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Let Gemini AI suggest a relevant task based on the employee&apos;s profile</p>
                {aiError && <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>{aiError}</p>}
              </div>
              <button type="button" onClick={suggestWithAI} disabled={aiLoading}
                className="btn btn-secondary text-sm px-4 py-2 flex-shrink-0"
                style={{ border: '1px solid hsl(262 60% 55% / 0.4)', color: 'hsl(262 60% 65%)' }}>
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {aiLoading ? 'Generating...' : 'Suggest'}
              </button>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
                <ClipboardList className="inline w-3.5 h-3.5 mr-1" />Task Title *
              </label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Complete sprint review documentation" required className="input-base" />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
                Description
              </label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Additional details about the task..." rows={3}
                className="input-base resize-none" />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
                Priority *
              </label>
              <div className="flex gap-3">
                {PRIORITIES.map(p => {
                  const cfg = priorityConfig[p]
                  return (
                    <button key={p} type="button" onClick={() => setPriority(p)}
                      className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all"
                      style={{
                        background: priority === p ? cfg.bg : 'var(--color-surface-2)',
                        color: priority === p ? cfg.color : 'var(--color-muted)',
                        border: `2px solid ${priority === p ? cfg.color : 'var(--color-border)'}`,
                      }}>
                      {p}
                    </button>
                  )
                })}
              </div>
            </div>

            <button type="submit" disabled={submitting} className="btn btn-primary w-full mt-2">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Assigning...</> : 'Assign Task'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
