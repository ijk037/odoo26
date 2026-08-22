import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')

// POST /api/ai/task-suggest
// Body: { employeeName, department, designation, existingTasks? }
// Returns AI-suggested task title + description
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: caller } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'manager'].includes(caller?.role ?? ''))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { employeeName, department, designation, existingTasks } = await request.json()

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'AI feature not configured. Please add GEMINI_API_KEY to .env.local' }, { status: 503 })
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const prompt = `You are an HRMS assistant for Manipal University Jaipur.
Generate a concise, specific daily task for an employee with the following profile:
- Name: ${employeeName}
- Department: ${department ?? 'General'}
- Designation: ${designation ?? 'Staff'}
${existingTasks?.length ? `- Recent tasks: ${existingTasks.slice(0, 3).join(', ')}` : ''}

Return ONLY a JSON object (no markdown, no explanation) with this exact structure:
{
  "title": "Short action-oriented task title (max 10 words)",
  "description": "2-3 sentence task description with clear deliverables"
}`

    const result = await model.generateContent(prompt)
    const text   = result.response.text().trim()

    // Strip any markdown fences if model adds them
    const cleaned = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
    const parsed  = JSON.parse(cleaned)

    return NextResponse.json({ data: parsed })
  } catch (err) {
    console.error('Gemini error:', err)
    return NextResponse.json({ error: 'AI generation failed. Please try again.' }, { status: 500 })
  }
}
