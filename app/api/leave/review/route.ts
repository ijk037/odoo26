import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/leave/review — admin approves/rejects a leave request
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: caller } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (caller?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { leaveId, action } = await request.json()
  if (!leaveId || !['approved', 'rejected'].includes(action))
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })

  const { data, error } = await supabase
    .from('leave_requests')
    .update({ status: action, reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq('id', leaveId)
    .eq('status', 'pending') // only allow reviewing pending ones
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data)  return NextResponse.json({ error: 'Leave request not found or already reviewed.' }, { status: 404 })
  return NextResponse.json({ data, message: `Leave ${action}.` })
}

// GET /api/leave/review — admin sees all pending leave requests
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: caller } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (caller?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('leave_requests')
    .select('*, employee:profiles!leave_requests_employee_id_fkey(id, full_name, email, department, designation)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
