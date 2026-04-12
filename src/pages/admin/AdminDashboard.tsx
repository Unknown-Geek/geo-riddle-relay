import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Users,
  MapPin,
  Trophy,
  Settings,
  LogOut,
  Plus,
  Activity,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import TeamsManagementModal from '@/components/admin/TeamsManagementModal';
import LeaderboardModal from '@/components/admin/LeaderboardModal';
import GameSettingsModal from '@/components/admin/GameSettingsModal';
import CheckpointsManagementModal from '@/components/admin/CheckpointsManagementModal';
import ActivityLogsModal from '@/components/admin/ActivityLogsModal';

interface DashboardStats {
  totalTeams: number;
  activeTeams: number;
  completedTeams: number;
  totalCheckpoints: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalTeams: 0,
    activeTeams: 0,
    completedTeams: 0,
    totalCheckpoints: 0,
  });
  const [authorizing, setAuthorizing] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  
  // Modal states
  const [teamsModalOpen, setTeamsModalOpen] = useState(false);
  const [checkpointsModalOpen, setCheckpointsModalOpen] = useState(false);
  const [leaderboardModalOpen, setLeaderboardModalOpen] = useState(false);
  const [activityLogsModalOpen, setActivityLogsModalOpen] = useState(false);
  const [gameSettingsModalOpen, setGameSettingsModalOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const enforceAdminGuard = () => {
      const hardcodedEmail = import.meta.env.VITE_ADMIN_EMAIL;
      const hardcodedPassword = import.meta.env.VITE_ADMIN_PASSWORD;

      if (!hardcodedEmail || !hardcodedPassword) {
        toast({
          variant: 'destructive',
          title: 'Admin access not configured',
          description: 'Admin credentials are not properly configured.',
        });
        navigate('/admin');
        setAuthorizing(false);
        return;
      }

      // Always allow access if hardcoded credentials are configured
      setAuthorized(true);
      setAuthorizing(false);
    };

    enforceAdminGuard();
  }, [navigate, toast]);

  useEffect(() => {
    if (!authorized) return;
    const loadStats = async () => {
      setStatsLoading(true);
      try {
        const { data: teams, error: teamsError } = await supabase
          .from('teams')
          .select('status');

        if (teamsError) throw teamsError;

        const { count: checkpointCount, error: checkpointsError } = await supabase
          .from('checkpoints')
          .select('id', { count: 'exact', head: true });

        if (checkpointsError) throw checkpointsError;

        const totalTeams = teams?.length ?? 0;
        const activeTeams = teams?.filter(t => t.status === 'active').length ?? 0;
        const completedTeams = teams?.filter(t => t.status === 'completed').length ?? 0;
        const totalCheckpoints = checkpointCount ?? 0;

        setStats({ totalTeams, activeTeams, completedTeams, totalCheckpoints });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        toast({
          variant: 'destructive',
          title: 'Error loading dashboard',
          description: 'Failed to load dashboard statistics.',
        });
      } finally {
        setStatsLoading(false);
      }
    };

    loadStats();
  }, [authorized, toast]);

  const handleLogout = () => {
    toast({
      title: 'Logged out',
      description: 'You have been logged out of the admin panel.',
    });
    navigate('/admin');
  };

  const handleStartGame = async () => {
    try {
      const { error } = await supabase
        .from('game_settings')
        .update({ setting_value: 'true' })
        .eq('setting_key', 'game_active');

      if (error) throw error;

      toast({
        title: 'Game Started',
        description: 'The treasure hunt is now active!',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to start game',
        description: error.message,
      });
    }
  };

  const handleExportResults = async () => {
    try {
      const { data: teams, error } = await supabase
        .from('teams')
        .select('name, leader_email, current_score, status, completed_at')
        .order('current_score', { ascending: false });

      if (error) throw error;

      const csvContent = [
        'Team Name,Leader Email,Score,Status,Completed At',
        ...teams.map(team => 
          `"${team.name}","${team.leader_email}",${team.current_score || 0},"${team.status || 'pending'}","${team.completed_at || 'Not completed'}"`
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `treasure-hunt-results-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Results Exported',
        description: 'Team results have been downloaded as CSV.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Export failed',
        description: error.message,
      });
    }
  };

  const handleResetScores = async () => {
    if (!confirm('Are you sure you want to reset all team scores? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('teams')
        .update({ 
          current_score: 0,
          status: 'pending',
          completed_at: null,
          help_tokens_used: 0
        })
        .gt('created_at', '1900-01-01');

      if (error) throw error;

      // Also clear submissions
      const { error: submissionsError } = await supabase
        .from('submissions')
        .delete()
        .gt('created_at', '1900-01-01');

      if (submissionsError) throw submissionsError;

      toast({
        title: 'Scores Reset',
        description: 'All team scores and submissions have been reset.',
      });
      
      // Reload stats
      if (authorized) {
        const loadStats = async () => {
          setStatsLoading(true);
          try {
            const { data: teams, error: teamsError } = await supabase
              .from('teams')
              .select('status');
    
            if (teamsError) throw teamsError;
    
            const { count: checkpointCount, error: checkpointsError } = await supabase
              .from('checkpoints')
              .select('id', { count: 'exact', head: true });
    
            if (checkpointsError) throw checkpointsError;
    
            const totalTeams = teams?.length ?? 0;
            const activeTeams = teams?.filter(t => t.status === 'active').length ?? 0;
            const completedTeams = teams?.filter(t => t.status === 'completed').length ?? 0;
            const totalCheckpoints = checkpointCount ?? 0;
    
            setStats({ totalTeams, activeTeams, completedTeams, totalCheckpoints });
          } catch (error) {
            console.error('Error fetching dashboard stats:', error);
          } finally {
            setStatsLoading(false);
          }
        };
        loadStats();
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Reset failed',
        description: error.message,
      });
    }
  };

  if (authorizing || statsLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center space-y-4">
          <Shield className="h-12 w-12 text-primary mx-auto animate-pulse" />
          <p className="text-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <nav className="flex justify-between items-center p-6 border-b border-border">
        <div className="flex items-center space-x-2">
          <Shield className="h-8 w-8 text-destructive" />
          <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
          <Badge variant="destructive" className="ml-2">RESTRICTED</Badge>
        </div>
        <Button variant="outline" onClick={handleLogout} className="glass-card">
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Dashboard Overview</h2>
          <p className="text-muted-foreground">
            Manage your campus treasure hunt from this administrative panel
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass-card border-glass-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Teams</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold text-foreground">{stats.totalTeams}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-glass-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Teams</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-success" />
                <span className="text-2xl font-bold text-foreground">{stats.activeTeams}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-glass-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-warning" />
                <span className="text-2xl font-bold text-foreground">{stats.completedTeams}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-glass-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Checkpoints</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-accent" />
                <span className="text-2xl font-bold text-foreground">{stats.totalCheckpoints}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="glass-card border-glass-border hover:glow-primary transition-glow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Users className="h-5 w-5 text-primary" />
                Teams Management
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                View, edit, and manage all registered teams
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" onClick={() => setTeamsModalOpen(true)}>
                Manage Teams
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card border-glass-border hover:glow-primary transition-glow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <MapPin className="h-5 w-5 text-accent" />
                Checkpoints & Riddles
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Configure game locations and questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" onClick={() => setCheckpointsModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Checkpoint
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card border-glass-border hover:glow-primary transition-glow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Trophy className="h-5 w-5 text-warning" />
                Live Leaderboard
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Monitor real-time game progress and scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" onClick={() => setLeaderboardModalOpen(true)}>
                View Leaderboard
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card border-glass-border hover:glow-primary transition-glow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Activity className="h-5 w-5 text-success" />
                Activity Logs
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Review submission logs and security events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" onClick={() => setActivityLogsModalOpen(true)}>
                View Logs
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card border-glass-border hover:glow-primary transition-glow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Settings className="h-5 w-5 text-muted-foreground" />
                Game Settings
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Configure game rules and parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" onClick={() => setGameSettingsModalOpen(true)}>
                Settings
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card border-glass-border bg-gradient-primary">
            <CardHeader>
              <CardTitle className="text-primary-foreground">Quick Actions</CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Common administrative tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button size="sm" variant="secondary" className="w-full" onClick={handleStartGame}>
                Start Game
              </Button>
              <Button size="sm" variant="secondary" className="w-full" onClick={handleExportResults}>
                Export Results
              </Button>
              <Button size="sm" variant="secondary" className="w-full" onClick={handleResetScores}>
                Reset Scores
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card className="glass-card border-destructive/20 bg-destructive/5">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-destructive">
                <Shield className="h-5 w-5" />
                <p className="text-sm font-medium">
                  Administrative Access - All actions are logged and monitored
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <TeamsManagementModal
        isOpen={teamsModalOpen}
        onClose={() => setTeamsModalOpen(false)}
      />
      <CheckpointsManagementModal
        isOpen={checkpointsModalOpen}
        onClose={() => setCheckpointsModalOpen(false)}
      />
      <LeaderboardModal
        isOpen={leaderboardModalOpen}
        onClose={() => setLeaderboardModalOpen(false)}
      />
      <ActivityLogsModal
        isOpen={activityLogsModalOpen}
        onClose={() => setActivityLogsModalOpen(false)}
      />
      <GameSettingsModal
        isOpen={gameSettingsModalOpen}
        onClose={() => setGameSettingsModalOpen(false)}
      />
    </div>
  );
};

export default AdminDashboard;