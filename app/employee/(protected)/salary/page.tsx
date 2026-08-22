import { createClient } from '@/lib/supabase/server'
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Salary' }

export default async function EmployeeSalaryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: salary } = await supabase
    .from('salary_structures')
    .select('*')
    .eq('employee_id', user!.id)
    .order('effective_from', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: history } = await supabase
    .from('salary_structures')
    .select('*')
    .eq('employee_id', user!.id)
    .order('effective_from', { ascending: false })

  if (!salary) return (
    <div className="animate-fade-in max-w-2xl">
      <div className="page-header">
        <h1>My Salary</h1>
        <p>Your current compensation details.</p>
      </div>
      <div className="card flex flex-col items-center py-12" style={{ color: 'var(--color-muted)' }}>
        <AlertCircle className="w-12 h-12 mb-4 opacity-30" />
        <p className="font-medium text-lg">No salary structure assigned yet.</p>
        <p className="text-sm mt-1">Please contact your admin.</p>
      </div>
    </div>
  )

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="page-header">
        <h1>My Salary</h1>
        <p>Current compensation effective from {formatDate(salary.effective_from)}.</p>
      </div>

      {/* Net Salary Hero */}
      <div className="card mb-5 text-center py-8"
        style={{ background: 'linear-gradient(135deg, hsl(224 75% 50% / 0.15), hsl(262 60% 55% / 0.10))', border: '1px solid hsl(224 75% 50% / 0.3)' }}>
        <p className="text-sm uppercase tracking-widest font-semibold mb-2" style={{ color: 'var(--color-muted)' }}>Monthly Net Salary</p>
        <p className="text-5xl font-bold" style={{ color: 'var(--color-foreground)' }}>{formatCurrency(salary.net_salary)}</p>
        <p className="text-sm mt-2" style={{ color: 'var(--color-muted)' }}>Effective from {formatDate(salary.effective_from)}</p>
      </div>

      {/* Breakdown */}
      <div className="card mb-5">
        <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--color-foreground)' }}>Salary Breakdown</h2>
        <div className="space-y-3">
          {[
            { label: 'Basic Salary',    value: salary.basic_salary, color: 'var(--color-foreground)', icon: DollarSign, sign: '' },
            { label: 'HRA',            value: salary.hra,           color: 'var(--color-info)',    icon: TrendingUp,   sign: '+' },
            { label: 'Allowances',     value: salary.allowances,    color: 'var(--color-success)', icon: TrendingUp,   sign: '+' },
            { label: 'Deductions',     value: salary.deductions,    color: 'var(--color-danger)',  icon: TrendingDown, sign: '−' },
          ].map(({ label, value, color, sign }) => (
            <div key={label} className="flex items-center justify-between py-2.5 px-4 rounded-xl"
              style={{ background: 'var(--color-surface-2)' }}>
              <span className="text-sm" style={{ color: 'var(--color-muted)' }}>{label}</span>
              <span className="font-semibold text-sm" style={{ color }}>
                {sign}{formatCurrency(value)}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between py-3 px-4 rounded-xl"
            style={{ background: 'var(--color-success-bg)', border: '1px solid hsl(142 50% 20%)' }}>
            <span className="font-bold" style={{ color: 'var(--color-success)' }}>Net Salary</span>
            <span className="font-bold text-lg" style={{ color: 'var(--color-success)' }}>{formatCurrency(salary.net_salary)}</span>
          </div>
        </div>
      </div>

      {/* History */}
      {history && history.length > 1 && (
        <div className="card">
          <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--color-foreground)' }}>Salary History</h2>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Effective From</th><th>Basic</th><th>Net Salary</th></tr></thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={h.id}>
                    <td>{formatDate(h.effective_from)} {i === 0 && <span className="badge badge-success ml-2">Current</span>}</td>
                    <td>{formatCurrency(h.basic_salary)}</td>
                    <td className="font-semibold" style={{ color: 'var(--color-success)' }}>{formatCurrency(h.net_salary)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
