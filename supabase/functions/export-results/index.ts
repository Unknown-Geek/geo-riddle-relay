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
    const { format = 'csv' } = await req.json()

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch all teams
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('name, leader_email, current_score, status, completed_at, help_tokens_used, member_names, created_at')
      .order('current_score', { ascending: false })

    if (teamsError) throw teamsError

    // Fetch all submissions
    const { data: submissions } = await supabase
      .from('submissions')
      .select('team_id, riddle_id, submitted_answer, status, points_awarded, submitted_at, help_token_used')
      .order('submitted_at', { ascending: false })

    if (format === 'json') {
      return new Response(
        JSON.stringify({ teams, submissions }, null, 2),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // CSV format
    const csvLines = [
      'Team Name,Leader Email,Score,Status,Help Tokens Used,Completed At,Created At,Members',
      ...(teams || []).map(team =>
        `"${team.name}","${team.leader_email}",${team.current_score || 0},"${team.status || 'pending'}",${team.help_tokens_used || 0},"${team.completed_at || ''}","${team.created_at || ''}","${(team.member_names || []).join('; ')}"`
      ),
    ]

    return new Response(csvLines.join('\n'), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="treasure-hunt-results.csv"',
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
