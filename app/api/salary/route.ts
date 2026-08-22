import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET  /api/salary — employee's own salary
// POST /api/salary — admin creates/updates salary structure
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('salary_structures')
    .select('*')
    .eq('employee_id', user.id)
    .order('effective_from', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: caller } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (caller?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { employeeId, basicSalary, hra, allowances, deductions, effectiveFrom } = await request.json()
  if (!employeeId || basicSalary == null || !effectiveFrom)
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })

  const { data, error } = await supabase.from('salary_structures').insert({
    employee_id:    employeeId,
    basic_salary:   basicSalary,
    hra:            hra ?? 0,
    allowances:     allowances ?? 0,
    deductions:     deductions ?? 0,
    effective_from: effectiveFrom,
    created_by:     user.id,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, message: 'Salary structure saved.' }, { status: 201 })
}
