import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/salary/all — admin only, list all employees' latest salary
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: caller } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (caller?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('salary_structures')
    .select('*, employee:profiles!salary_structures_employee_id_fkey(id, full_name, email, department, designation)')
    .order('effective_from', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // De-duplicate: keep only latest per employee
  const seen = new Set<string>()
  const latest = (data ?? []).filter(s => {
    const eid = typeof s.employee === 'object' && s.employee !== null
      ? (s.employee as { id: string }).id
      : null
    if (!eid || seen.has(eid)) return false
    seen.add(eid)
    return true
  })

  return NextResponse.json({ data: latest })
}
