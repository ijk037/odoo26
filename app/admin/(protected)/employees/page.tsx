import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, UserCheck, Clock, Search } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Employees — Admin' }

export default async function AdminEmployeesPage() {
  const supabase = await createClient()

  const { data: employees } = await supabase
    .from('profiles')
    .select('id, full_name, email, department, designation, profile_status, joining_date, manager:profiles!profiles_manager_id_fkey(full_name)')
    .eq('role', 'employee')
    .order('full_name')

  const verified  = employees?.filter(e => e.profile_status === 'verified').length ?? 0
  const pending   = employees?.filter(e => e.profile_status === 'pending').length  ?? 0
  const unmanaged = employees?.filter(e => !e.manager).length ?? 0

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>All Employees</h1>
        <p>Overview of all registered employees in the system.</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <span className="label">Total Employees</span>
          <span className="value" style={{ color: 'var(--color-brand-400)' }}>{employees?.length ?? 0}</span>
        </div>
        <div className="stat-card">
          <span className="label">Verified</span>
          <span className="value" style={{ color: 'var(--color-success)' }}>{verified}</span>
        </div>
        <div className="stat-card">
          <span className="label">Pending Review</span>
          <span className="value" style={{ color: 'var(--color-warning)' }}>{pending}</span>
        </div>
      </div>

      <div className="card">
        {employees && employees.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Employee</th><th>Department</th><th>Designation</th><th>Manager</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => {
                  const mgr = Array.isArray(emp.manager) ? emp.manager[0] : emp.manager
                  return (
                    <tr key={emp.id}>
                      <td>
                        <p className="font-medium text-sm" style={{ color: 'var(--color-foreground)' }}>{emp.full_name ?? '—'}</p>
                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{emp.email}</p>
                      </td>
                      <td>{emp.department ? <span className="badge badge-info">{emp.department}</span> : '—'}</td>
                      <td className="text-sm" style={{ color: 'var(--color-muted)' }}>{emp.designation ?? '—'}</td>
                      <td className="text-sm" style={{ color: mgr?.full_name ? 'var(--color-foreground)' : 'var(--color-danger)' }}>
                        {mgr?.full_name ?? 'Unassigned'}
                      </td>
                      <td>
                        <span className={`badge ${
                          emp.profile_status === 'verified'          ? 'badge-success' :
                          emp.profile_status === 'pending'           ? 'badge-warning' :
                          emp.profile_status === 'changes_requested' ? 'badge-danger'  : 'badge-neutral'
                        }`}>{emp.profile_status}</span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <Link href={`/admin/verification/${emp.id}`} className="btn btn-ghost text-xs px-2 py-1">
                            View
                          </Link>
                          <Link href="/admin/manager-allocation" className="btn btn-ghost text-xs px-2 py-1">
                            Assign
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center py-12" style={{ color: 'var(--color-muted)' }}>
            <Users className="w-10 h-10 mb-3 opacity-30" />
            <p>No employees registered yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
