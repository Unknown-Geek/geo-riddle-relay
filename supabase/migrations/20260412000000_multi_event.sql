-- Riddle Relay: Multi-event schema migration
-- This migration converts the single-event schema into a multi-tenant system
-- where organizers can create and manage their own events.

-- ============================================
-- Step 1: Create new ENUM types
-- ============================================

CREATE TYPE event_status AS ENUM ('draft', 'active', 'paused', 'completed');
CREATE TYPE user_role AS ENUM ('organizer', 'player');

-- ============================================
-- Step 2: Create profiles table (Supabase Auth)
-- ============================================

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    avatar_url TEXT,
    role user_role DEFAULT 'player',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Step 3: Create events table
-- ============================================

CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    cover_image_url TEXT,
    organizer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    status event_status DEFAULT 'draft',
    settings JSONB DEFAULT '{
        "help_tokens_per_team": 3,
        "max_teams": 50,
        "max_time_minutes": 180,
        "time_penalty_per_minute": 5
    }'::jsonb,
    invite_code VARCHAR(8) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for slug lookups
CREATE INDEX idx_events_slug ON public.events(slug);
CREATE INDEX idx_events_organizer ON public.events(organizer_id);
CREATE INDEX idx_events_invite_code ON public.events(invite_code);

-- ============================================
-- Step 4: Modify teams table for multi-event
-- ============================================

-- Add event_id column
ALTER TABLE public.teams ADD COLUMN event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;
ALTER TABLE public.teams ADD COLUMN team_code VARCHAR(8) UNIQUE;
ALTER TABLE public.teams ADD COLUMN leader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Make member_names optional (leader-only signup)
ALTER TABLE public.teams ALTER COLUMN member_names DROP NOT NULL;
ALTER TABLE public.teams ALTER COLUMN member_names SET DEFAULT '{}';

-- Drop old unique constraints and add event-scoped ones
ALTER TABLE public.teams DROP CONSTRAINT teams_name_key;
ALTER TABLE public.teams DROP CONSTRAINT teams_leader_email_key;

CREATE UNIQUE INDEX idx_teams_name_per_event ON public.teams(name, event_id) WHERE name IS NOT NULL;
CREATE INDEX idx_teams_event ON public.teams(event_id);
CREATE INDEX idx_teams_team_code ON public.teams(team_code);

-- ============================================
-- Step 5: Create team_members table
-- ============================================

CREATE TABLE public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    display_name VARCHAR(255),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

CREATE INDEX idx_team_members_team ON public.team_members(team_id);
CREATE INDEX idx_team_members_user ON public.team_members(user_id);

-- ============================================
-- Step 6: Modify checkpoints for multi-event
-- ============================================

ALTER TABLE public.checkpoints ADD COLUMN event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;
CREATE INDEX idx_checkpoints_event ON public.checkpoints(event_id);

-- ============================================
-- Step 7: Modify activity_logs for multi-event
-- ============================================

ALTER TABLE public.activity_logs ADD COLUMN event_id UUID REFERENCES public.events(id) ON DELETE SET NULL;
CREATE INDEX idx_activity_logs_event ON public.activity_logs(event_id);

-- ============================================
-- Step 8: Replace game_settings with event-level settings
-- ============================================

-- The game_settings table is no longer needed; settings are stored in events.settings JSONB
-- We'll drop it after migration (or you can keep it for backward compat)
DROP TABLE IF EXISTS public.game_settings;

-- ============================================
-- Step 9: Drop old admin_users (replaced by profiles with organizer role)
-- ============================================

DROP TABLE IF EXISTS public.admin_users;

-- ============================================
-- Step 10: Row-Level Security
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.riddles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Drop old wide-open policies
DROP POLICY IF EXISTS "Public read access for teams" ON public.teams;
DROP POLICY IF EXISTS "Public write access for teams" ON public.teams;
DROP POLICY IF EXISTS "Public delete access for teams" ON public.teams;
DROP POLICY IF EXISTS "Anyone can create teams" ON public.teams;
DROP POLICY IF EXISTS "Public access for checkpoints" ON public.checkpoints;
DROP POLICY IF EXISTS "Public access for riddles" ON public.riddles;
DROP POLICY IF EXISTS "Public access for submissions" ON public.submissions;
DROP POLICY IF EXISTS "Only admins can access admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Public access for activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Public access for game settings" ON public.game_settings;

-- === Profiles ===
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Allow reading profiles for team member display (restricted)
CREATE POLICY "Users can read profiles of teammates" ON public.profiles
    FOR SELECT USING (
        id IN (
            SELECT tm.user_id FROM public.team_members tm
            JOIN public.teams t ON tm.team_id = t.id
            WHERE t.id IN (
                SELECT tm2.team_id FROM public.team_members tm2
                WHERE tm2.user_id = auth.uid()
            )
        )
    );

-- === Events ===
CREATE POLICY "Organizers can CRUD own events" ON public.events
    FOR ALL USING (auth.uid() = organizer_id);

CREATE POLICY "Anyone can read active events" ON public.events
    FOR SELECT USING (status IN ('active', 'completed'));

CREATE POLICY "Players can read events they joined" ON public.events
    FOR SELECT USING (
        id IN (
            SELECT t.event_id FROM public.teams t
            JOIN public.team_members tm ON tm.team_id = t.id
            WHERE tm.user_id = auth.uid()
        )
    );

-- === Teams ===
CREATE POLICY "Organizers can read teams in their events" ON public.teams
    FOR SELECT USING (
        event_id IN (SELECT id FROM public.events WHERE organizer_id = auth.uid())
    );

CREATE POLICY "Team members can read own team" ON public.teams
    FOR SELECT USING (
        id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Team leaders can update own team" ON public.teams
    FOR UPDATE USING (
        leader_id = auth.uid()
    );

CREATE POLICY "Authenticated users can create teams" ON public.teams
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Organizers can update teams in their events" ON public.teams
    FOR UPDATE USING (
        event_id IN (SELECT id FROM public.events WHERE organizer_id = auth.uid())
    );

CREATE POLICY "Organizers can delete teams in their events" ON public.teams
    FOR DELETE USING (
        event_id IN (SELECT id FROM public.events WHERE organizer_id = auth.uid())
    );

-- === Team Members ===
CREATE POLICY "Team members can read own team members" ON public.team_members
    FOR SELECT USING (
        team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
        OR team_id IN (
            SELECT t.id FROM public.teams t
            JOIN public.events e ON t.event_id = e.id
            WHERE e.organizer_id = auth.uid()
        )
    );

CREATE POLICY "Team leaders can add members" ON public.team_members
    FOR INSERT WITH CHECK (
        team_id IN (SELECT id FROM public.teams WHERE leader_id = auth.uid())
    );

CREATE POLICY "Team leaders can remove members" ON public.team_members
    FOR DELETE USING (
        team_id IN (SELECT id FROM public.teams WHERE leader_id = auth.uid())
    );

-- === Checkpoints ===
CREATE POLICY "Organizers can CRUD checkpoints in their events" ON public.checkpoints
    FOR ALL USING (
        event_id IN (SELECT id FROM public.events WHERE organizer_id = auth.uid())
    );

CREATE POLICY "Team members can read checkpoints in their event" ON public.checkpoints
    FOR SELECT USING (
        event_id IN (
            SELECT t.event_id FROM public.teams t
            JOIN public.team_members tm ON tm.team_id = t.id
            WHERE tm.user_id = auth.uid()
        )
    );

-- === Riddles ===
CREATE POLICY "Organizers can CRUD riddles in their events" ON public.riddles
    FOR ALL USING (
        checkpoint_id IN (
            SELECT id FROM public.checkpoints
            WHERE event_id IN (SELECT id FROM public.events WHERE organizer_id = auth.uid())
        )
    );

-- Players can read riddles but NOT the correct_answer column
-- This requires a view or a function; we'll use a security barrier view
CREATE VIEW public.player_riddles AS
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

-- === Submissions ===
CREATE POLICY "Players can insert own submissions" ON public.submissions
    FOR INSERT WITH CHECK (
        team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Players can read own submissions" ON public.submissions
    FOR SELECT USING (
        team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Organizers can read submissions in their events" ON public.submissions
    FOR SELECT USING (
        team_id IN (
            SELECT t.id FROM public.teams t
            WHERE t.event_id IN (SELECT id FROM public.events WHERE organizer_id = auth.uid())
        )
    );

-- === Activity Logs ===
CREATE POLICY "Organizers can read activity logs in their events" ON public.activity_logs
    FOR SELECT USING (
        event_id IN (SELECT id FROM public.events WHERE organizer_id = auth.uid())
    );

CREATE POLICY "System can insert activity logs" ON public.activity_logs
    FOR INSERT WITH CHECK (true);

-- ============================================
-- Step 11: Helper function to generate invite codes
-- ============================================

CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS VARCHAR(8) AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result VARCHAR(8) := '';
    i INTEGER;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate invite_code for new events
CREATE OR REPLACE FUNCTION public.set_event_invite_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invite_code IS NULL OR NEW.invite_code = '' THEN
        NEW.invite_code := public.generate_invite_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_event_invite_code
    BEFORE INSERT ON public.events
    FOR EACH ROW EXECUTE FUNCTION public.set_event_invite_code();

-- Auto-generate team_code for new teams
CREATE OR REPLACE FUNCTION public.set_team_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.team_code IS NULL OR NEW.team_code = '' THEN
        NEW.team_code := public.generate_invite_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_team_code
    BEFORE INSERT ON public.teams
    FOR EACH ROW EXECUTE FUNCTION public.set_team_code();

-- ============================================
-- Step 12: Auto-generate slug from event name
-- ============================================

CREATE OR REPLACE FUNCTION public.slugify(text_to_slug TEXT)
RETURNS VARCHAR(255) AS $$
DECLARE
    result VARCHAR(255);
BEGIN
    result := lower(text_to_slug);
    result := regexp_replace(result, '[^a-z0-9\s-]', '', 'g');
    result := regexp_replace(result, '\s+', '-', 'g');
    result := regexp_replace(result, '-+', '-', 'g');
    result := trim(both '-' from result);
    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- Step 13: Updated trigger for profiles
-- ============================================

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
