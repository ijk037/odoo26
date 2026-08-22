import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')

// POST /api/ai/work-summary
// Body: { date, reports: [{employeeName, task, workCompleted}] }
// Returns AI-generated team performance summary
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: caller } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'manager'].includes(caller?.role ?? ''))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { date, reports } = await request.json()

  if (!reports?.length)
    return NextResponse.json({ error: 'No work reports to summarize.' }, { status: 400 })

  if (!process.env.GEMINI_API_KEY)
    return NextResponse.json({ error: 'AI feature not configured. Please add GEMINI_API_KEY to .env.local' }, { status: 503 })

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const reportText = reports.map((r: { employeeName: string; task: string; workCompleted: string; hours?: number }, i: number) =>
      `${i + 1}. ${r.employeeName} (${r.task}): ${r.workCompleted}${r.hours ? ` [${r.hours}h]` : ''}`
    ).join('\n')

    const prompt = `You are a manager assistant at Manipal University Jaipur HRMS.
Analyze the following team work reports for ${date} and provide a brief, insightful summary.

Work Reports:
${reportText}

Return ONLY a JSON object (no markdown) with this structure:
{
  "headline": "One sentence executive summary of team performance",
  "highlights": ["2-3 key achievements or observations as array items"],
  "concerns": ["Any issues or items needing follow-up (empty array if none)"],
  "recommendation": "One actionable recommendation for tomorrow"
}`

    const result  = await model.generateContent(prompt)
    const text    = result.response.text().trim()
    const cleaned = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
    const parsed  = JSON.parse(cleaned)

    return NextResponse.json({ data: parsed })
  } catch (err) {
    console.error('Gemini error:', err)
    return NextResponse.json({ error: 'AI analysis failed. Please try again.' }, { status: 500 })
  }
}
