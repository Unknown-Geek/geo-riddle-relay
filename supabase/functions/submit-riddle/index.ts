import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { teamId, riddleId, checkpointId, answer, latitude, longitude } = await req.json()

    if (!teamId || !riddleId || !checkpointId || !answer) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: teamId, riddleId, checkpointId, answer' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch the riddle to check the answer
    const { data: riddle, error: riddleError } = await supabase
      .from('riddles')
      .select('correct_answer, max_points, is_active')
      .eq('id', riddleId)
      .single()

    if (riddleError || !riddle) {
      return new Response(
        JSON.stringify({ error: 'Riddle not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!riddle.is_active) {
      return new Response(
        JSON.stringify({ error: 'Riddle is not active' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if team already solved this riddle correctly
    const { data: existingCorrect } = await supabase
      .from('submissions')
      .select('id')
      .eq('team_id', teamId)
      .eq('riddle_id', riddleId)
      .eq('status', 'correct')
      .maybeSingle()

    if (existingCorrect) {
      return new Response(
        JSON.stringify({ error: 'Riddle already solved by this team', message: 'You already solved this riddle!' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Compare answer (case-insensitive, trimmed)
    const normalizedAnswer = answer.trim().toLowerCase()
    const normalizedCorrect = riddle.correct_answer.trim().toLowerCase()
    const isCorrect = normalizedAnswer === normalizedCorrect

    // Calculate distance from checkpoint if coordinates provided
    let distanceFromCheckpoint = null
    if (latitude && longitude) {
      const { data: checkpoint } = await supabase
        .from('checkpoints')
        .select('latitude, longitude, radius_meters')
        .eq('id', checkpointId)
        .single()

      if (checkpoint) {
        const R = 6371000 // Earth radius in meters
        const toRad = (v: number) => (v * Math.PI) / 180
        const dLat = toRad(checkpoint.latitude - latitude)
        const dLon = toRad(checkpoint.longitude - longitude)
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(toRad(latitude)) * Math.cos(toRad(checkpoint.latitude)) * Math.sin(dLon / 2) ** 2
        distanceFromCheckpoint = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      }
    }

    const submissionStatus = isCorrect ? 'correct' : 'incorrect'
    const pointsAwarded = isCorrect ? (riddle.max_points || 100) : 0

    // Insert the submission
    const { data: submission, error: insertError } = await supabase
      .from('submissions')
      .insert({
        team_id: teamId,
        riddle_id: riddleId,
        checkpoint_id: checkpointId,
        submitted_answer: answer.trim(),
        status: submissionStatus,
        points_awarded: pointsAwarded,
        latitude: latitude || null,
        longitude: longitude || null,
        distance_from_checkpoint: distanceFromCheckpoint,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Submission insert error:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to record submission' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If correct, update team score and checkpoint progress
    if (isCorrect) {
      // Fetch current team data
      const { data: team } = await supabase
        .from('teams')
        .select('current_score, current_checkpoint_id, status')
        .eq('id', teamId)
        .single()

      if (team) {
        const newScore = (team.current_score || 0) + pointsAwarded

        // Check if all riddles in this checkpoint are solved
        const { data: checkpointRiddles } = await supabase
          .from('riddles')
          .select('id')
          .eq('checkpoint_id', checkpointId)
          .eq('is_active', true)

        const { data: correctSubmissions } = await supabase
          .from('submissions')
          .select('riddle_id')
          .eq('team_id', teamId)
          .eq('checkpoint_id', checkpointId)
          .eq('status', 'correct')

        const solvedRiddleIds = new Set((correctSubmissions || []).map(s => s.riddle_id))
        const allSolved = (checkpointRiddles || []).every(r => solvedRiddleIds.has(r.id))

        // Find next checkpoint
        let nextCheckpointId = team.current_checkpoint_id
        let newStatus = team.status

        if (allSolved) {
          const { data: nextCheckpoint } = await supabase
            .from('checkpoints')
            .select('id')
            .gt('order_number', await supabase
              .from('checkpoints')
              .select('order_number')
              .eq('id', checkpointId)
              .single()
              .then(r => r.data?.order_number || 0)
            )
            .eq('is_active', true)
            .order('order_number', { ascending: true })
            .limit(1)
            .maybeSingle()

          if (nextCheckpoint) {
            nextCheckpointId = nextCheckpoint.id
          } else {
            // No more checkpoints - team has completed!
            newStatus = 'completed'
          }

          // Activate team if still pending
          if (team.status === 'pending') {
            newStatus = 'active'
          }
        } else if (team.status === 'pending') {
          newStatus = 'active'
        }

        // Update team
        const updatePayload: Record<string, any> = {
          current_score: newScore,
        }

        if (nextCheckpointId !== team.current_checkpoint_id) {
          updatePayload.current_checkpoint_id = nextCheckpointId
        }
        if (newStatus !== team.status) {
          updatePayload.status = newStatus
        }
        if (newStatus === 'completed') {
          updatePayload.completed_at = new Date().toISOString()
        }

        await supabase.from('teams').update(updatePayload).eq('id', teamId)
      }

      // Log activity
      await supabase.from('activity_logs').insert({
        team_id: teamId,
        action_type: 'submission',
        description: `Team solved a riddle correctly! +${pointsAwarded} points`,
        metadata: { riddle_id: riddleId, checkpoint_id: checkpointId, points: pointsAwarded },
      })
    } else {
      // Log incorrect attempt
      await supabase.from('activity_logs').insert({
        team_id: teamId,
        action_type: 'submission',
        description: 'Team submitted an incorrect answer',
        metadata: { riddle_id: riddleId, checkpoint_id: checkpointId, answer: answer.trim() },
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: submissionStatus,
        points_awarded: pointsAwarded,
        message: isCorrect
          ? 'Correct! Well done!'
          : 'Incorrect answer. Try again!',
        submission,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('submit-riddle error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
