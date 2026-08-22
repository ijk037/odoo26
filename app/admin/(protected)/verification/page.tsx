import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ClipboardCheck, Clock, CheckCircle2, AlertCircle, Users } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Profile Verification' }

export default async function AdminVerificationPage() {
  const supabase = await createClient()

  const [
    { data: pending },
    { data: approved },
    { data: changesRequested },
  ] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email, department, designation, created_at')
      .eq('role', 'employee').eq('profile_status', 'pending').order('created_at'),
    supabase.from('profiles').select('id, full_name, email, department, verified_at')
      .eq('role', 'employee').eq('profile_status', 'verified').order('verified_at', { ascending: false }).limit(10),
    supabase.from('profiles').select('id, full_name, email, department, updated_at')
      .eq('role', 'employee').eq('profile_status', 'changes_requested').order('updated_at', { ascending: false }),
  ])

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Profile Verification</h1>
        <p>Review and approve employee profile submissions.</p>
      </div>

      {/* Pending */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-5 pb-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <Clock className="w-5 h-5" style={{ color: 'var(--color-warning)' }} />
          <h2 className="text-base font-semibold" style={{ color: 'var(--color-foreground)' }}>
            Pending Review <span className="ml-2 badge badge-warning">{pending?.length ?? 0}</span>
          </h2>
        </div>
        {pending && pending.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead><tr>
                <th>Employee</th><th>Department</th><th>Designation</th><th>Submitted</th><th>Action</th>
              </tr></thead>
              <tbody>
                {pending.map(emp => (
                  <tr key={emp.id}>
                    <td>
                      <div>
                        <p className="font-medium" style={{ color: 'var(--color-foreground)' }}>{emp.full_name ?? '—'}</p>
                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{emp.email}</p>
                      </div>
                    </td>
                    <td>{emp.department ? <span className="badge badge-info">{emp.department}</span> : '—'}</td>
                    <td style={{ color: 'var(--color-muted)' }}>{emp.designation ?? '—'}</td>
                    <td className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      {new Date(emp.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td>
                      <Link href={`/admin/verification/${emp.id}`}
                        className="btn btn-primary text-xs px-3 py-1.5">
                        Review →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center py-10" style={{ color: 'var(--color-muted)' }}>
            <CheckCircle2 className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">No pending profiles — all caught up! 🎉</p>
          </div>
        )}
      </div>

      {/* Changes Requested */}
      {changesRequested && changesRequested.length > 0 && (
        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-5 pb-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <AlertCircle className="w-5 h-5" style={{ color: 'var(--color-danger)' }} />
            <h2 className="text-base font-semibold" style={{ color: 'var(--color-foreground)' }}>
              Awaiting Resubmission <span className="ml-2 badge badge-danger">{changesRequested.length}</span>
            </h2>
          </div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Employee</th><th>Department</th><th>Action</th></tr></thead>
              <tbody>
                {changesRequested.map(emp => (
                  <tr key={emp.id}>
                    <td>
                      <p className="font-medium">{emp.full_name ?? '—'}</p>
                      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{emp.email}</p>
                    </td>
                    <td>{emp.department ? <span className="badge badge-info">{emp.department}</span> : '—'}</td>
                    <td>
                      <Link href={`/admin/verification/${emp.id}`} className="btn btn-secondary text-xs px-3 py-1.5">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recently Verified */}
      <div className="card">
        <div className="flex items-center gap-2 mb-5 pb-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
          <h2 className="text-base font-semibold" style={{ color: 'var(--color-foreground)' }}>
            Recently Verified <span className="ml-2 badge badge-success">{approved?.length ?? 0}</span>
          </h2>
        </div>
        {approved && approved.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Employee</th><th>Department</th><th>Verified On</th><th>Action</th></tr></thead>
              <tbody>
                {approved.map(emp => (
                  <tr key={emp.id}>
                    <td>
                      <p className="font-medium">{emp.full_name ?? '—'}</p>
                      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{emp.email}</p>
                    </td>
                    <td>{emp.department ? <span className="badge badge-info">{emp.department}</span> : '—'}</td>
                    <td className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      {emp.verified_at ? new Date(emp.verified_at).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td>
                      <Link href={`/admin/verification/${emp.id}`} className="btn btn-ghost text-xs px-3 py-1.5">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center py-8" style={{ color: 'var(--color-muted)' }}>
            <Users className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">No verified profiles yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
