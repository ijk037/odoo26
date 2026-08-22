import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { isWithinRadius } from '@/lib/haversine'

// POST /api/attendance/checkin
// Body: { latitude, longitude, qrLocationId }
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { latitude, longitude, qrLocationId } = await request.json()

  if (latitude == null || longitude == null)
    return NextResponse.json({ error: 'Location is required.' }, { status: 400 })

  // Fetch company location from DB
  const { data: location, error: locError } = await supabase
    .from('attendance_locations')
    .select('*')
    .eq('id', qrLocationId)
    .eq('is_active', true)
    .single()

  if (locError || !location)
    return NextResponse.json({ error: 'Invalid or inactive QR code location.' }, { status: 400 })

  // Server-side GPS validation
  const result = isWithinRadius(
    latitude, longitude,
    location.latitude, location.longitude,
    location.allowed_radius
  )

  if (!result.valid)
    return NextResponse.json({
      error: `You are ${Math.round(result.distance)}m away from the office. Must be within ${location.allowed_radius}m.`,
      distance: result.distance,
    }, { status: 403 })

  const today = new Date().toISOString().split('T')[0]

  // Check for duplicate check-in
  const { data: existing } = await supabase
    .from('attendance')
    .select('id, check_in, check_out')
    .eq('employee_id', user.id)
    .eq('date', today)
    .maybeSingle()

  if (existing?.check_in)
    return NextResponse.json({ error: 'Already checked in for today.' }, { status: 409 })

  // Get today's task
  const { data: task } = await supabase
    .from('daily_tasks')
    .select('id')
    .eq('employee_id', user.id)
    .eq('task_date', today)
    .maybeSingle()

  const { data: attendance, error: insertError } = await supabase
    .from('attendance')
    .upsert({
      employee_id: user.id,
      task_id: task?.id ?? null,
      date: today,
      check_in: new Date().toISOString(),
      check_in_latitude: latitude,
      check_in_longitude: longitude,
      check_in_distance: Math.round(result.distance),
      status: 'present',
    }, { onConflict: 'employee_id,date' })
    .select()
    .single()

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
  return NextResponse.json({ data: attendance, message: 'Checked in successfully!' })
}
