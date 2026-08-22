import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/profile — fetch own profile
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// PATCH /api/profile — update own profile (only if draft or changes_requested)
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify current status allows editing
  const { data: existing } = await supabase
    .from('profiles')
    .select('profile_status')
    .eq('id', user.id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  if (!['draft', 'changes_requested'].includes(existing.profile_status)) {
    return NextResponse.json(
      { error: 'Profile cannot be edited in its current status.' },
      { status: 403 }
    )
  }

  const body = await request.json()

  // Only allow safe fields to be updated by employee
  const allowed = [
    'full_name', 'date_of_birth', 'phone', 'address', 'profile_photo',
    'employee_id', 'department', 'designation', 'joining_date',
    'skills', 'education', 'experience',
  ]
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, message: 'Profile saved.' })
}
