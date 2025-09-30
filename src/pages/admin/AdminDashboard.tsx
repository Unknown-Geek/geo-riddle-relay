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
              <Button className="w-full" variant="outline">
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
              <Button className="w-full" variant="outline">
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
              <Button className="w-full" variant="outline">
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
              <Button className="w-full" variant="outline">
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
              <Button className="w-full" variant="outline">
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
              <Button size="sm" variant="secondary" className="w-full">
                Start Game
              </Button>
              <Button size="sm" variant="secondary" className="w-full">
                Export Results
              </Button>
              <Button size="sm" variant="secondary" className="w-full">
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
    </div>
  );
};

export default AdminDashboard;