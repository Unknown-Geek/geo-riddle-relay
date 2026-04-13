-- Security fixes migration
-- 1. Add security_barrier to player_riddles view
-- 2. Fix activity_logs INSERT policy

-- Drop and recreate the view with security_barrier
DROP VIEW IF EXISTS public.player_riddles;

CREATE VIEW public.player_riddles WITH (security_barrier = true) AS
    SELECT id, checkpoint_id, question, max_points, time_penalty_per_minute,
           order_number, is_active, created_at, updated_at
    FROM public.riddles
    WHERE checkpoint_id IN (
        SELECT c.id FROM public.checkpoints c
        WHERE c.event_id IN (
            SELECT t.event_id FROM public.teams t
            JOIN public.team_members tm ON tm.team_id = t.id
            WHERE tm.user_id = auth.uid()
        )
    );

-- Fix activity_logs INSERT policy: only allow inserts from authenticated users
-- where the event_id matches a team they belong to
DROP POLICY IF EXISTS "System can insert activity logs" ON public.activity_logs;

CREATE POLICY "Authenticated users can insert activity logs for their events" ON public.activity_logs
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        AND event_id IN (
            SELECT t.event_id FROM public.teams t
            JOIN public.team_members tm ON tm.team_id = t.id
            WHERE tm.user_id = auth.uid()
        )
    );

-- Note: Edge Functions use the service_role key which bypasses RLS,
-- so this policy only affects direct client-side inserts.
-- The service_role key should still work for system-generated logs.
