import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/admin/assign-manager
// Body: { employeeId, managerId }
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: adminProfile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (adminProfile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { employeeId, managerId } = await request.json()
  if (!employeeId) return NextResponse.json({ error: 'Missing employeeId' }, { status: 400 })

  // Verify the target is not assigning themselves as their own manager
  if (employeeId === managerId) return NextResponse.json({ error: 'Employee cannot be their own manager.' }, { status: 400 })

  // Verify managerId is actually a manager (or null to unassign)
  if (managerId) {
    const { data: mgr } = await supabase.from('profiles').select('role').eq('id', managerId).single()
    if (!mgr || mgr.role !== 'manager') {
      return NextResponse.json({ error: 'Selected user is not a manager.' }, { status: 400 })
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ manager_id: managerId ?? null })
    .eq('id', employeeId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: managerId ? 'Manager assigned.' : 'Manager removed.' })
}
