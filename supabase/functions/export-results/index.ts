import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { authenticateUser, verifyOrganizer, getCorsHeaders } from '../_shared/auth.ts'

// CSV injection: prefix dangerous characters with a tab
function sanitizeCsvCell(value: string): string {
  if (/^[=+\-@\t\r]/.test(value)) {
    return '\t' + value
  }
  return value
}

// In-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(key: string, maxCalls: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= maxCalls) return false
  entry.count++
  return true
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // --- Auth check ---
    const { userId, supabase, error: authError } = await authenticateUser(req)
    if (authError) return authError

    // --- Rate limit: 5 exports per minute per user ---
    if (!checkRateLimit(`export:${userId}`, 5, 60_000)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please wait a moment.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --- Validate input ---
    const body = await req.json()
    const { eventId, format = 'csv' } = body

    if (!eventId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: eventId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --- Verify organizer owns this event ---
    const isOrganizer = await verifyOrganizer(supabase, eventId, userId)
    if (!isOrganizer) {
      return new Response(
        JSON.stringify({ error: 'You are not authorized to export this event' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --- Fetch teams for this event ---
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('name, leader_email, current_score, status, completed_at, help_tokens_used, member_names, created_at')
      .eq('event_id', eventId)
      .order('current_score', { ascending: false })

    if (teamsError) throw teamsError

    // --- Fetch submissions for this event ---
    const { data: submissions } = await supabase
      .from('submissions')
      .select('team_id, riddle_id, submitted_answer, status, points_awarded, submitted_at, help_token_used')
      .in('team_id', (teams || []).map(t => t.id))
      .order('submitted_at', { ascending: false })

    if (format === 'json') {
      return new Response(
        JSON.stringify({ teams, submissions }, null, 2),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --- CSV format (with injection sanitization) ---
    const csvLines = [
      'Team Name,Leader Email,Score,Status,Help Tokens Used,Completed At,Created At,Members',
      ...(teams || []).map(team =>
        `"${sanitizeCsvCell(team.name)}","${sanitizeCsvCell(team.leader_email || '')}",${team.current_score || 0},"${team.status || 'pending'}",${team.help_tokens_used || 0},"${team.completed_at || ''}","${team.created_at || ''}","${(team.member_names || []).join('; ')}"`
      ),
    ]

    return new Response(csvLines.join('\n'), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="event-results.csv"',
      },
    })
  } catch (error) {
    console.error('export-results error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
