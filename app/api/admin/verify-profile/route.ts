import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/admin/verify-profile
// Body: { employeeId, action: 'approve' | 'request_changes', comment? }
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify caller is admin
  const { data: adminProfile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (adminProfile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { employeeId, action, comment } = await request.json()
  if (!employeeId || !action) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  if (action === 'approve') {
    const { error } = await supabase.from('profiles').update({
      profile_status: 'verified',
      verified_by: user.id,
      verified_at: new Date().toISOString(),
      admin_comment: null,
    }).eq('id', employeeId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ message: 'Profile approved.' })
  }

  if (action === 'request_changes') {
    if (!comment?.trim()) return NextResponse.json({ error: 'Comment is required for change requests.' }, { status: 400 })
    const { error } = await supabase.from('profiles').update({
      profile_status: 'changes_requested',
      admin_comment: comment,
    }).eq('id', employeeId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ message: 'Changes requested.' })
  }

  return NextResponse.json({ error: 'Invalid action.' }, { status: 400 })
}
