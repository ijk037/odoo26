import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json()

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: 'Email, password and full name are required.' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }

    // Use service role key to create user WITHOUT email confirmation
    const adminSupabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Create user via admin API — auto-confirms email
    const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // skip email confirmation
      user_metadata: {
        role: 'employee',
        full_name: fullName,
      },
    })

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    // Update the auto-created profile with full_name and email
    await adminSupabase
      .from('profiles')
      .update({ full_name: fullName, email, role: 'employee' })
      .eq('id', newUser.user.id)

    return NextResponse.json({ success: true, userId: newUser.user.id })
  } catch {
    return NextResponse.json({ error: 'Signup failed. Please try again.' }, { status: 500 })
  }
}
