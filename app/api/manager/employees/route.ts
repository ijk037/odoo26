import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/manager/employees — list my employees
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: mgr } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (mgr?.role !== 'manager') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, department, designation, profile_photo, profile_status, joining_date')
    .eq('manager_id', user.id)
    .eq('role', 'employee')
    .order('full_name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
