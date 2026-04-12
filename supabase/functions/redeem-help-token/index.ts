import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { teamId, checkpointId, riddleId } = await req.json()

    if (!teamId || !checkpointId || !riddleId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: teamId, checkpointId, riddleId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check team's help tokens used
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('help_tokens_used, name')
      .eq('id', teamId)
      .single()

    if (teamError || !team) {
      return new Response(
        JSON.stringify({ error: 'Team not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check max help tokens from game settings
    const { data: setting } = await supabase
      .from('game_settings')
      .select('setting_value')
      .eq('setting_key', 'help_tokens_per_team')
      .single()

    const maxTokens = setting ? parseInt(setting.setting_value) : 3

    if ((team.help_tokens_used || 0) >= maxTokens) {
      return new Response(
        JSON.stringify({ error: 'No help tokens remaining', hint: null }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if a help token was already used for this specific riddle
    const { data: existingHelp } = await supabase
      .from('submissions')
      .select('id')
      .eq('team_id', teamId)
      .eq('riddle_id', riddleId)
      .eq('help_token_used', true)
      .maybeSingle()

    if (existingHelp) {
      // Already used help for this riddle - return the hint again
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

    // Get the checkpoint hint
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

    // Increment help_tokens_used
    const newTokensUsed = (team.help_tokens_used || 0) + 1
    await supabase
      .from('teams')
      .update({ help_tokens_used: newTokensUsed })
      .eq('id', teamId)

    // Log activity
    await supabase.from('activity_logs').insert({
      team_id: teamId,
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
