import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/profile/submit — submit profile for admin review (draft/changes_requested → pending)
export async function POST() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch profile to validate required fields
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  if (!['draft', 'changes_requested'].includes(profile.profile_status)) {
    return NextResponse.json(
      { error: 'Profile is already submitted or verified.' },
      { status: 400 }
    )
  }

  // Validate required fields before submission
  const required = ['full_name', 'phone', 'date_of_birth', 'department', 'designation']
  const missing = required.filter(f => !profile[f])
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Please fill in required fields: ${missing.join(', ')}` },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ profile_status: 'pending', admin_comment: null })
    .eq('id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, message: 'Profile submitted for review.' })
}
