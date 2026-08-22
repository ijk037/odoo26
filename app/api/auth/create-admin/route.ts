import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/auth/create-admin
// Creates or promotes an existing user to admin role
// Body: { email, password, fullName }
export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }

    const adminSupabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if user already exists
    const { data: existingUsers } = await adminSupabase.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === email)

    let userId: string

    if (existingUser) {
      userId = existingUser.id
      // Confirm email if not confirmed
      await adminSupabase.auth.admin.updateUserById(userId, {
        email_confirm: true,
        password: password,
      })
    } else {
      // Create brand new user
      const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: 'admin', full_name: fullName ?? 'Admin' },
      })
      if (createError) return NextResponse.json({ error: createError.message }, { status: 400 })
      userId = newUser.user.id
    }

    // Upsert profile as admin
    const { error: profileError } = await adminSupabase
      .from('profiles')
      .upsert({
        id: userId,
        email,
        full_name: fullName ?? 'Administrator',
        role: 'admin',
        profile_status: 'verified',
      }, { onConflict: 'id' })

    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

    return NextResponse.json({ success: true, message: 'Admin account ready. You can now log in.' })
  } catch {
    return NextResponse.json({ error: 'Failed to create admin account.' }, { status: 500 })
  }
}
