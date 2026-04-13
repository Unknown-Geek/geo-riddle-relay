import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { authenticateUser, verifyTeamMembership, getCorsHeaders } from '../_shared/auth.ts'

// In-memory rate limiter (per Deno isolate)
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

    // --- Rate limit: 10 redemptions per minute per user ---
    if (!checkRateLimit(`redeem:${userId}`, 10, 60_000)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please wait a moment.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --- Validate input ---
    const body = await req.json()
    const { teamId, checkpointId, riddleId } = body

    if (!teamId || !checkpointId || !riddleId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: teamId, checkpointId, riddleId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --- Verify team membership ---
    const isMember = await verifyTeamMembership(supabase, teamId, userId)
    if (!isMember) {
      return new Response(
        JSON.stringify({ error: 'You are not a member of this team' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --- Check team's help tokens ---
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('help_tokens_used, name, event_id')
      .eq('id', teamId)
      .single()

    if (teamError || !team) {
      return new Response(
        JSON.stringify({ error: 'Team not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get max help tokens from event settings
    const { data: event } = await supabase
      .from('events')
      .select('settings')
      .eq('id', team.event_id)
      .single()

    const maxTokens = event?.settings?.help_tokens_per_team ?? 3

    if ((team.help_tokens_used || 0) >= maxTokens) {
      return new Response(
        JSON.stringify({ error: 'No help tokens remaining', hint: null }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --- Check if already redeemed for this riddle ---
    const { data: existingHelp } = await supabase
      .from('submissions')
      .select('id')
      .eq('team_id', teamId)
      .eq('riddle_id', riddleId)
      .eq('help_token_used', true)
      .maybeSingle()

    if (existingHelp) {
      const { data: checkpoint } = await supabase
        .from('checkpoints')
        .select('help_token_hint')
        .eq('id', checkpointId)
        .single()

      return new Response(
        JSON.stringify({
          hint: checkpoint?.help_token_hint || 'No hint available for this checkpoint.',
          alreadyRedeemed: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --- Get the hint ---
    const { data: checkpoint } = await supabase
      .from('checkpoints')
      .select('help_token_hint')
      .eq('id', checkpointId)
      .single()

    if (!checkpoint?.help_token_hint) {
      return new Response(
        JSON.stringify({ error: 'No hint available for this checkpoint', hint: null }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --- Increment help_tokens_used ---
    const newTokensUsed = (team.help_tokens_used || 0) + 1
    await supabase
      .from('teams')
      .update({ help_tokens_used: newTokensUsed })
      .eq('id', teamId)

    // --- Log activity ---
    await supabase.from('activity_logs').insert({
      team_id: teamId,
      event_id: team.event_id,
      action_type: 'help_token',
      description: `Team "${team.name}" redeemed a help token`,
      metadata: { riddle_id: riddleId, checkpoint_id: checkpointId, tokens_used: newTokensUsed },
    })

    return new Response(
      JSON.stringify({
        hint: checkpoint.help_token_hint,
        tokens_remaining: maxTokens - newTokensUsed,
        tokens_used: newTokensUsed,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('redeem-help-token error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
