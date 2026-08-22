import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET  /api/leave — employee's own leave requests
// POST /api/leave — employee submits a new leave request
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('employee_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { leaveType, startDate, endDate, reason } = await request.json()
  if (!leaveType || !startDate || !endDate || !reason)
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })

  if (new Date(endDate) < new Date(startDate))
    return NextResponse.json({ error: 'End date must be after start date.' }, { status: 400 })

  const { data, error } = await supabase.from('leave_requests').insert({
    employee_id: user.id,
    leave_type:  leaveType,
    start_date:  startDate,
    end_date:    endDate,
    reason,
    status:      'pending',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, message: 'Leave request submitted.' }, { status: 201 })
}
