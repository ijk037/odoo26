import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/manager/tasks — create a daily task
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: mgr } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (mgr?.role !== 'manager') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { employeeId, title, description, priority, taskDate } = await request.json()
  if (!employeeId || !title || !priority || !taskDate)
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })

  // Verify employee belongs to this manager
  const { data: emp } = await supabase
    .from('profiles').select('manager_id').eq('id', employeeId).single()
  if (emp?.manager_id !== user.id)
    return NextResponse.json({ error: 'Employee is not in your team.' }, { status: 403 })

  // Check if task already exists for that employee on that date
  const { data: existing } = await supabase
    .from('daily_tasks')
    .select('id').eq('employee_id', employeeId).eq('task_date', taskDate).maybeSingle()
  if (existing)
    return NextResponse.json({ error: 'A task is already assigned to this employee for that date.' }, { status: 409 })

  const { data, error } = await supabase.from('daily_tasks').insert({
    employee_id: employeeId,
    manager_id: user.id,
    title,
    description: description ?? null,
    priority,
    task_date: taskDate,
    status: 'assigned',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, message: 'Task assigned.' }, { status: 201 })
}

// GET /api/manager/tasks?date=YYYY-MM-DD — list today's tasks
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const date = request.nextUrl.searchParams.get('date') ?? new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('daily_tasks')
    .select('*, employee:profiles!daily_tasks_employee_id_fkey(id, full_name, email, department, designation, profile_photo)')
    .eq('manager_id', user.id)
    .eq('task_date', date)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
