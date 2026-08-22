import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// GET /api/auth/seed
// ONE-TIME: Creates admin, one employee, one manager with fixed credentials.
// Safe to call multiple times — uses upsert so it won't duplicate.
export async function GET() {
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const accounts = [
    {
      email:    'lalitdubeytehari7023@gmail.com',
      password: 'Tehari@123',
      fullName: 'Lalit Dubey',
      role:     'admin',
      status:   'verified',
    },
    {
      email:    'shahsuryansh2006@gmail.com',
      password: 'Surymuj@2026',
      fullName: 'Suryansh Shah',
      role:     'employee',
      status:   'pending',
    },
    {
      email:    'shahsuryansh330@gmail.com',
      password: 'Surymuj@2025',
      fullName: 'Suryansh Shah (Manager)',
      role:     'manager',
      status:   'verified',
    },
  ]

  const results: { email: string; status: string; note?: string }[] = []

  for (const account of accounts) {
    try {
      // Try to find existing user
      const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 })
      const existing = list?.users?.find(u => u.email === account.email)

      let userId: string

      if (existing) {
        // Update password + confirm email
        await supabase.auth.admin.updateUserById(existing.id, {
          password:      account.password,
          email_confirm: true,
        })
        userId = existing.id
        results.push({ email: account.email, status: 'updated', note: 'Password reset, email confirmed' })
      } else {
        // Create fresh
        const { data: created, error } = await supabase.auth.admin.createUser({
          email:         account.email,
          password:      account.password,
          email_confirm: true,
          user_metadata: { role: account.role, full_name: account.fullName },
        })
        if (error || !created?.user) {
          results.push({ email: account.email, status: 'error', note: error?.message })
          continue
        }
        userId = created.user.id
        results.push({ email: account.email, status: 'created' })
      }

      // Upsert profile
      await supabase.from('profiles').upsert({
        id:             userId,
        email:          account.email,
        full_name:      account.fullName,
        role:           account.role,
        profile_status: account.status,
        updated_at:     new Date().toISOString(),
      }, { onConflict: 'id' })

    } catch (err) {
      results.push({ email: account.email, status: 'exception', note: String(err) })
    }
  }

  return NextResponse.json({
    message: 'Seed complete. All accounts are ready.',
    results,
  })
}
