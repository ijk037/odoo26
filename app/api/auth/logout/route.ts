import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let redirectTo = '/employee/login'
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role === 'admin') redirectTo = '/admin/login'
    else if (profile?.role === 'manager') redirectTo = '/manager/login'
    await supabase.auth.signOut()
  }

  return NextResponse.redirect(new URL(redirectTo, process.env.NEXT_PUBLIC_APP_URL!))
}
