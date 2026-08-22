import { createClient } from '@/lib/supabase/server'
import { Users, ClipboardCheck, UserCheck, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin Dashboard' }

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const [
    { count: totalEmployees },
    { count: pendingVerification },
    { count: totalManagers },
    { data: recentPending },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'employee'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('profile_status', 'pending'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'manager'),
    supabase.from('profiles').select('id, full_name, email, department, created_at')
      .eq('profile_status', 'pending').order('created_at', { ascending: false }).limit(5),
  ])

  const stats = [
    { label: 'Total Employees', value: totalEmployees ?? 0, icon: Users, color: 'var(--color-brand-400)' },
    { label: 'Pending Review',  value: pendingVerification ?? 0, icon: ClipboardCheck, color: 'var(--color-warning)' },
    { label: 'Total Managers',  value: totalManagers ?? 0, icon: UserCheck, color: 'var(--color-success)' },
  ]

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome back — here&apos;s an overview of your workforce.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
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

      {/* Pending verifications */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" style={{ color: 'var(--color-warning)' }} />
            <h2 className="text-base font-semibold" style={{ color: 'var(--color-foreground)' }}>Pending Verifications</h2>
          </div>
          <Link href="/admin/verification" className="text-sm font-medium" style={{ color: 'var(--color-brand-400)' }}>
            View all →
          </Link>
        </div>

        {recentPending && recentPending.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentPending.map((emp) => (
                  <tr key={emp.id}>
                    <td className="font-medium">{emp.full_name ?? '—'}</td>
                    <td style={{ color: 'var(--color-muted)' }}>{emp.email}</td>
                    <td>
                      {emp.department
                        ? <span className="badge badge-info">{emp.department}</span>
                        : <span style={{ color: 'var(--color-muted)' }}>—</span>}
                    </td>
                    <td>
                      <Link href={`/admin/verification/${emp.id}`}
                        className="badge badge-warning cursor-pointer hover:opacity-80 transition-opacity">
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12" style={{ color: 'var(--color-muted)' }}>
            <UserCheck className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">No pending verifications 🎉</p>
          </div>
        )}
      </div>
    </div>
  )
}
