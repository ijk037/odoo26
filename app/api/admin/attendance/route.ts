import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/admin/attendance?date=YYYY-MM-DD&employeeId=...
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: caller } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'manager'].includes(caller?.role ?? '')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const date       = request.nextUrl.searchParams.get('date')
  const employeeId = request.nextUrl.searchParams.get('employeeId')

  let query = supabase
    .from('attendance')
    .select('*, employee:profiles!attendance_employee_id_fkey(id, full_name, email, department, designation, profile_photo, manager_id), task:daily_tasks(title, priority, status)')
    .order('date', { ascending: false })

  if (date)       query = query.eq('date', date)
  if (employeeId) query = query.eq('employee_id', employeeId)

  // Managers can only see their own team
  if (caller?.role === 'manager') {
    const { data: myEmployees } = await supabase
      .from('profiles').select('id').eq('manager_id', user.id)
    const ids = (myEmployees ?? []).map(e => e.id)
    if (ids.length === 0) return NextResponse.json({ data: [] })
    query = query.in('employee_id', ids)
  }

  const { data, error } = await query.limit(200)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
