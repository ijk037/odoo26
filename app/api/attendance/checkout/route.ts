import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { isWithinRadius } from '@/lib/haversine'

// POST /api/attendance/checkout
// Body: { latitude, longitude, workCompleted }
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { latitude, longitude, workCompleted } = await request.json()

  if (latitude == null || longitude == null)
    return NextResponse.json({ error: 'Location is required.' }, { status: 400 })

  const today = new Date().toISOString().split('T')[0]

  // Get today's attendance record
  const { data: attendance } = await supabase
    .from('attendance')
    .select('*')
    .eq('employee_id', user.id)
    .eq('date', today)
    .single()

  if (!attendance?.check_in)
    return NextResponse.json({ error: 'You have not checked in today.' }, { status: 400 })

  if (attendance.check_out)
    return NextResponse.json({ error: 'Already checked out for today.' }, { status: 409 })

  // Validate location at checkout too (must still be in office)
  const { data: location } = await supabase
    .from('attendance_locations')
    .select('*')
    .eq('is_active', true)
    .limit(1)
    .single()

  if (location) {
    const result = isWithinRadius(latitude, longitude, location.latitude, location.longitude, location.allowed_radius)
    if (!result.valid) {
      return NextResponse.json({
        error: `You must be within ${location.allowed_radius}m of the office to check out. You are ${Math.round(result.distance)}m away.`,
        distance: result.distance,
      }, { status: 403 })
    }
  }

  // Calculate working hours
  const checkInTime  = new Date(attendance.check_in).getTime()
  const checkOutTime = new Date().getTime()
  const workingHours = (checkOutTime - checkInTime) / (1000 * 60 * 60)

  const { data: updated, error } = await supabase
    .from('attendance')
    .update({
      check_out: new Date().toISOString(),
      check_out_latitude: latitude,
      check_out_longitude: longitude,
      check_out_distance: location
        ? Math.round(isWithinRadius(latitude, longitude, location.latitude, location.longitude, location.allowed_radius).distance)
        : null,
      working_hours: Math.round(workingHours * 100) / 100,
      work_completed: workCompleted ?? null,
    })
    .eq('id', attendance.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update task status to completed if work report submitted
  if (workCompleted && attendance.task_id) {
    await supabase.from('daily_tasks')
      .update({ status: 'completed' })
      .eq('id', attendance.task_id)
  }

  return NextResponse.json({ data: updated, message: 'Checked out successfully!' })
}
