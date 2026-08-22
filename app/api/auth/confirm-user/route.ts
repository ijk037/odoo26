import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/auth/confirm-user
// Body: { email: string }
// Confirms a user's email and promotes to admin using service role
export async function POST(request: NextRequest) {
  try {
    const { email, role } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
    }

    const adminSupabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Find user by email
    const { data: { users }, error: listError } = await adminSupabase.auth.admin.listUsers()
    if (listError) return NextResponse.json({ error: listError.message }, { status: 500 })

    const user = users.find(u => u.email === email)
    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 })

    // Confirm email
    const { error: updateError } = await adminSupabase.auth.admin.updateUserById(user.id, {
      email_confirm: true,
    })
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    // Update role in profiles table if specified
    if (role && ['admin', 'manager', 'employee'].includes(role)) {
      await adminSupabase
        .from('profiles')
        .update({ role, profile_status: role === 'employee' ? 'draft' : 'verified' })
        .eq('id', user.id)
    }

    return NextResponse.json({ success: true, message: `User ${email} confirmed${role ? ` and set as ${role}` : ''}.` })
  } catch {
    return NextResponse.json({ error: 'Operation failed.' }, { status: 500 })
  }
}
