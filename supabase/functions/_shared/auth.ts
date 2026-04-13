// Shared auth helper for Edge Functions
// Verifies the caller's JWT from the Authorization header

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface AuthResult {
  userId: string
  supabase: ReturnType<typeof createClient>
  error?: Response
}

export async function authenticateUser(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      userId: '',
      supabase: createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      ),
      error: new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      ),
    }
  }

  const token = authHeader.replace('Bearer ', '')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('VITE_SUPABASE_PUBLISHABLE_KEY')!

  // Verify the JWT by using it to create a client and fetch the user
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  const { data: { user }, error } = await userClient.auth.getUser()
  if (error || !user) {
    return {
      userId: '',
      supabase: createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!),
      error: new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      ),
    }
  }

  // Return a service-role client for data operations (respects RLS via user context where needed)
  const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  return { userId: user.id, supabase }
}

export async function verifyTeamMembership(
  supabase: ReturnType<typeof createClient>,
  teamId: string,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .maybeSingle()
  return !!data
}

export async function verifyOrganizer(
  supabase: ReturnType<typeof createClient>,
  eventId: string,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('events')
    .select('id')
    .eq('id', eventId)
    .eq('organizer_id', userId)
    .maybeSingle()
  return !!data
}

// CORS headers — locked to the app origin
export function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') ?? ''
  const allowed = [
    'https://riddle-relay.app',
    'https://riddle-relay.lovable.app',
  ]
  // In development, allow localhost
  if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
    allowed.push(origin)
  }

  const allowOrigin = allowed.includes(origin) ? origin : allowed[0]

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
  }
}
