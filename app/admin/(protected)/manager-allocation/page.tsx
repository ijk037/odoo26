'use client'

import { useState, useEffect } from 'react'
import { UserCog, Users, Loader2, CheckCircle2, AlertCircle, Search } from 'lucide-react'
import type { Profile } from '@/types'

interface EmployeeRow {
  id: string
  full_name: string | null
  email: string
  department: string | null
  designation: string | null
  profile_status: string
  manager_id: string | null
  manager: { full_name: string | null } | null
}

export default function ManagerAllocationPage() {
  const [employees, setEmployees] = useState<EmployeeRow[]>([])
  const [managers, setManagers]   = useState<Profile[]>([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState<string | null>(null)
  const [toast, setToast]         = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [search, setSearch]       = useState('')

  useEffect(() => { loadData() }, [])

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  async function loadData() {
    const [empRes, mgrRes] = await Promise.all([
      fetch('/api/admin/employees'),
      fetch('/api/admin/managers'),
    ])
    const { data: empData } = await empRes.json()
    const { data: mgrData } = await mgrRes.json()
    setEmployees(empData ?? [])
    setManagers(mgrData ?? [])
    setLoading(false)
  }

  async function handleAssign(employeeId: string, managerId: string) {
    setSaving(employeeId)
    const res = await fetch('/api/admin/assign-manager', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, managerId: managerId || null }),
    })
    const result = await res.json()
    if (!res.ok) { showToast('error', result.error); setSaving(null); return }
    showToast('success', result.message)
    setSaving(null)
    await loadData()
  }

  const filtered = employees.filter(e =>
    !search || e.full_name?.toLowerCase().includes(search.toLowerCase()) || e.email.includes(search)
  )

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-brand-400)' }} />
    </div>
  )

  return (
    <div className="animate-fade-in">
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
        <h1>Manager Allocation</h1>
        <p>Assign managers to verified employees.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <span className="label">Total Employees</span>
          <span className="value" style={{ color: 'var(--color-brand-400)' }}>{employees.length}</span>
        </div>
        <div className="stat-card">
          <span className="label">Assigned</span>
          <span className="value" style={{ color: 'var(--color-success)' }}>
            {employees.filter(e => e.manager_id).length}
          </span>
        </div>
        <div className="stat-card">
          <span className="label">Unassigned</span>
          <span className="value" style={{ color: 'var(--color-warning)' }}>
            {employees.filter(e => !e.manager_id).length}
          </span>
        </div>
      </div>

      <div className="card">
        {/* Search */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-muted)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search employees..." className="input-base pl-10" />
          </div>
          <span className="text-sm" style={{ color: 'var(--color-muted)' }}>{filtered.length} employees</span>
        </div>

        {managers.length === 0 ? (
          <div className="flex flex-col items-center py-10" style={{ color: 'var(--color-muted)' }}>
            <Users className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">No managers found.</p>
            <p className="text-xs mt-1">Create manager accounts first to assign them here.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-10" style={{ color: 'var(--color-muted)' }}>
            <UserCog className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">No employees found.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Assign Manager</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(emp => (
                  <tr key={emp.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, hsl(224 75% 50%), hsl(262 60% 55%))' }}>
                          {(emp.full_name?.[0] ?? '?').toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm" style={{ color: 'var(--color-foreground)' }}>{emp.full_name ?? '—'}</p>
                          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>{emp.department ? <span className="badge badge-info">{emp.department}</span> : '—'}</td>
                    <td>
                      <span className={`badge ${
                        emp.profile_status === 'verified' ? 'badge-success' :
                        emp.profile_status === 'pending' ? 'badge-warning' : 'badge-neutral'
                      }`}>{emp.profile_status}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <select
                          value={emp.manager_id ?? ''}
                          onChange={e => handleAssign(emp.id, e.target.value)}
                          disabled={saving === emp.id}
                          className="input-base text-sm py-1.5 max-w-[200px]"
                          style={{ background: 'var(--color-surface-2)' }}>
                          <option value="">— Unassigned —</option>
                          {managers.map(m => (
                            <option key={m.id} value={m.id}>{m.full_name ?? m.email}</option>
                          ))}
                        </select>
                        {saving === emp.id && <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--color-brand-400)' }} />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
