'use client'

import { useState, useEffect } from 'react'
import { Plus, DollarSign, TrendingUp, TrendingDown, Loader2, CheckCircle2, AlertCircle, Search } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getTodayDate } from '@/lib/utils'

interface SalaryRecord {
  id: string
  basic_salary: number
  hra: number
  allowances: number
  deductions: number
  net_salary: number
  effective_from: string
  employee: {
    id: string
    full_name: string | null
    email: string
    department: string | null
    designation: string | null
  } | null
}

export default function AdminSalaryPage() {
  const [salaries, setSalaries] = useState<SalaryRecord[]>([])
  const [employees, setEmployees] = useState<{ id: string; full_name: string | null; email: string }[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast]       = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [search, setSearch]     = useState('')

  // Form fields
  const [selectedEmp, setSelectedEmp] = useState('')
  const [basic, setBasic]   = useState('')
  const [hra, setHra]       = useState('')
  const [allowances, setAllowances] = useState('')
  const [deductions, setDeductions] = useState('')
  const [effective, setEffective] = useState(getTodayDate())

  useEffect(() => {
    Promise.all([
      fetch('/api/salary/all').then(r => r.json()),
      fetch('/api/admin/employees').then(r => r.json()),
    ]).then(([s, e]) => {
      setSalaries(s.data ?? [])
      setEmployees(e.data ?? [])
      setLoading(false)
    })
  }, [])

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3500)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const res = await fetch('/api/salary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId:  selectedEmp,
        basicSalary: parseFloat(basic),
        hra:         parseFloat(hra || '0'),
        allowances:  parseFloat(allowances || '0'),
        deductions:  parseFloat(deductions || '0'),
        effectiveFrom: effective,
      }),
    })
    const result = await res.json()
    setSubmitting(false)
    if (!res.ok) { showToast('error', result.error); return }
    showToast('success', result.message)
    setShowForm(false)
    // Reload
    const s = await fetch('/api/salary/all').then(r => r.json())
    setSalaries(s.data ?? [])
  }

  const net = (parseFloat(basic || '0') + parseFloat(hra || '0') + parseFloat(allowances || '0') - parseFloat(deductions || '0'))
  const filtered = salaries.filter(s =>
    !search ||
    s.employee?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.employee?.department?.toLowerCase().includes(search.toLowerCase())
  )

  const totalPayroll = filtered.reduce((s, r) => s + r.net_salary, 0)

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

      <div className="flex items-start justify-between mb-6">
        <div className="page-header mb-0">
          <h1>Salary Management</h1>
          <p>Manage employee compensation structures.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary flex-shrink-0">
          <Plus className="w-4 h-4" /> {showForm ? 'Cancel' : 'Add Structure'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <span className="label">Employees on Payroll</span>
          <span className="value" style={{ color: 'var(--color-brand-400)' }}>{salaries.length}</span>
        </div>
        <div className="stat-card">
          <span className="label">Total Payroll</span>
          <span className="value text-xl" style={{ color: 'var(--color-success)' }}>{formatCurrency(totalPayroll)}</span>
        </div>
        <div className="stat-card">
          <span className="label">Not on Payroll</span>
          <span className="value" style={{ color: 'var(--color-warning)' }}>
            {Math.max(0, employees.length - salaries.length)}
          </span>
        </div>
      </div>

      {/* Add Salary Form */}
      {showForm && (
        <div className="card mb-6" style={{ border: '1px solid var(--color-brand-400)33' }}>
          <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--color-foreground)' }}>
            Create / Update Salary Structure
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>Employee *</label>
                <select value={selectedEmp} onChange={e => setSelectedEmp(e.target.value)}
                  required className="input-base" style={{ background: 'var(--color-surface-2)' }}>
                  <option value="">— Select Employee —</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.full_name ?? e.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>Effective From *</label>
                <input type="date" value={effective} onChange={e => setEffective(e.target.value)}
                  required className="input-base" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>Basic Salary *</label>
                <input type="number" value={basic} onChange={e => setBasic(e.target.value)}
                  placeholder="50000" min="0" required className="input-base" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>HRA</label>
                <input type="number" value={hra} onChange={e => setHra(e.target.value)}
                  placeholder="10000" min="0" className="input-base" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>Allowances</label>
                <input type="number" value={allowances} onChange={e => setAllowances(e.target.value)}
                  placeholder="5000" min="0" className="input-base" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>Deductions</label>
                <input type="number" value={deductions} onChange={e => setDeductions(e.target.value)}
                  placeholder="2000" min="0" className="input-base" />
              </div>
            </div>

            {/* Live net salary preview */}
            {basic && (
              <div className="px-4 py-3 rounded-xl flex items-center justify-between"
                style={{ background: 'var(--color-success-bg)', border: '1px solid hsl(142 50% 20%)' }}>
                <span className="text-sm font-medium" style={{ color: 'var(--color-success)' }}>Net Salary Preview</span>
                <span className="text-lg font-bold" style={{ color: 'var(--color-success)' }}>{formatCurrency(net)}</span>
              </div>
            )}

            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
              Save Salary Structure
            </button>
          </form>
        </div>
      )}

      {/* Salary Table */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-muted)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search employees..." className="input-base pl-10" />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-10" style={{ color: 'var(--color-muted)' }}>
            <DollarSign className="w-10 h-10 mb-3 opacity-30" />
            <p>No salary structures set up yet.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Employee</th><th>Basic</th><th>HRA</th><th>Allowances</th><th>Deductions</th><th>Net Salary</th><th>From</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id}>
                    <td>
                      <p className="font-medium text-sm">{s.employee?.full_name ?? '—'}</p>
                      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{s.employee?.department}</p>
                    </td>
                    <td style={{ color: 'var(--color-foreground)' }}>{formatCurrency(s.basic_salary)}</td>
                    <td style={{ color: 'var(--color-muted)' }}>{formatCurrency(s.hra)}</td>
                    <td style={{ color: 'var(--color-success)' }}>
                      <TrendingUp className="inline w-3 h-3 mr-1" />{formatCurrency(s.allowances)}
                    </td>
                    <td style={{ color: 'var(--color-danger)' }}>
                      <TrendingDown className="inline w-3 h-3 mr-1" />{formatCurrency(s.deductions)}
                    </td>
                    <td>
                      <span className="font-bold text-sm" style={{ color: 'var(--color-success)' }}>
                        {formatCurrency(s.net_salary)}
                      </span>
                    </td>
                    <td className="text-xs" style={{ color: 'var(--color-muted)' }}>{formatDate(s.effective_from)}</td>
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
