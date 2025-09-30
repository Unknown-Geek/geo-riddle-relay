-- Campus Treasure Hunt Database Schema

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types for better data integrity
CREATE TYPE team_status AS ENUM ('pending', 'active', 'completed', 'disqualified');
CREATE TYPE submission_status AS ENUM ('correct', 'incorrect', 'invalid');
CREATE TYPE admin_role AS ENUM ('super_admin', 'game_admin', 'moderator');

-- Teams table
CREATE TABLE public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    leader_email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    member_names TEXT[] NOT NULL CHECK (array_length(member_names, 1) <= 4),
    status team_status DEFAULT 'pending',
    current_score INTEGER DEFAULT 0,
    current_checkpoint_id UUID,
    team_color VARCHAR(7) DEFAULT '#00d9ff',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    help_tokens_used INTEGER DEFAULT 0
);

-- Checkpoints table (physical locations)
CREATE TABLE public.checkpoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    radius_meters INTEGER DEFAULT 50,
    order_number INTEGER NOT NULL,
    clue_text TEXT NOT NULL,
    help_token_hint TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Riddles table (questions for each checkpoint)
CREATE TABLE public.riddles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    checkpoint_id UUID NOT NULL REFERENCES public.checkpoints(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    max_points INTEGER DEFAULT 100,
    time_penalty_per_minute INTEGER DEFAULT 5,
    order_number INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team submissions table
CREATE TABLE public.submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    riddle_id UUID NOT NULL REFERENCES public.riddles(id) ON DELETE CASCADE,
    checkpoint_id UUID NOT NULL REFERENCES public.checkpoints(id) ON DELETE CASCADE,
    submitted_answer TEXT NOT NULL,
    status submission_status NOT NULL,
    points_awarded INTEGER DEFAULT 0,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    distance_from_checkpoint DECIMAL(8, 2),
    help_token_used BOOLEAN DEFAULT false
);

-- Admin users table (separate from team auth)
CREATE TABLE public.admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role admin_role DEFAULT 'game_admin',
    full_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Activity logs table
CREATE TABLE public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    admin_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game settings table
CREATE TABLE public.game_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES public.admin_users(id)
);

-- Insert default game settings
INSERT INTO public.game_settings (setting_key, setting_value, description) VALUES
('game_active', 'false', 'Whether the treasure hunt is currently active'),
('max_teams', '50', 'Maximum number of teams allowed'),
('max_time_minutes', '180', 'Maximum time allowed for the hunt in minutes'),
('help_tokens_per_team', '3', 'Number of help tokens each team gets');

-- Add indexes for performance
CREATE INDEX idx_teams_status ON public.teams(status);
CREATE INDEX idx_teams_score ON public.teams(current_score DESC);
CREATE INDEX idx_checkpoints_order ON public.checkpoints(order_number);
CREATE INDEX idx_riddles_checkpoint ON public.riddles(checkpoint_id);
CREATE INDEX idx_submissions_team ON public.submissions(team_id);
CREATE INDEX idx_submissions_riddle ON public.submissions(riddle_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.riddles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teams 
-- Allow public access for admin operations (since admin uses anon key)
CREATE POLICY "Public read access for teams" ON public.teams
    FOR SELECT USING (true);

CREATE POLICY "Public write access for teams" ON public.teams
    FOR UPDATE USING (true);

CREATE POLICY "Public delete access for teams" ON public.teams
    FOR DELETE USING (true);

CREATE POLICY "Anyone can create teams" ON public.teams
    FOR INSERT WITH CHECK (true);

-- RLS Policies for checkpoints - Allow full access for admin operations
CREATE POLICY "Public access for checkpoints" ON public.checkpoints
    FOR ALL USING (true);

-- RLS Policies for riddles - Allow full access for admin operations  
CREATE POLICY "Public access for riddles" ON public.riddles
    FOR ALL USING (true);

-- RLS Policies for submissions - Allow full access for admin operations
CREATE POLICY "Public access for submissions" ON public.submissions
    FOR ALL USING (true);

-- RLS Policies for admin users (admin access only)
CREATE POLICY "Only admins can access admin_users" ON public.admin_users
    FOR ALL USING (false);

-- RLS Policies for activity logs - Allow full access for admin operations
CREATE POLICY "Public access for activity logs" ON public.activity_logs
    FOR ALL USING (true);

-- RLS Policies for game settings - Allow full access for admin operations
CREATE POLICY "Public access for game settings" ON public.game_settings
    FOR ALL USING (true);

-- Create trigger function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_checkpoints_updated_at BEFORE UPDATE ON public.checkpoints
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_riddles_updated_at BEFORE UPDATE ON public.riddles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();