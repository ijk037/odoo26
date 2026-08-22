import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, email')
    .eq('id', user.id)
    .single()

  // Smart redirect — send to correct portal if wrong role
  if (!profile) redirect('/admin/login')
  if (profile.role === 'manager')  redirect('/manager/dashboard')
  if (profile.role === 'employee') redirect('/employee/dashboard')
  if (profile.role !== 'admin')    redirect('/admin/login')

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-background)' }}>
      <div className="w-60 flex-shrink-0">
        <Sidebar role="admin" userName={profile.full_name} userEmail={profile.email} />
      </div>
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
