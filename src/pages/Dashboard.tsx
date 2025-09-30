import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Compass, Trophy, MapPin, Users, LogOut, HelpCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Team {
  id: string;
  name: string;
  current_score: number;
  status: string;
  member_names: string[];
  help_tokens_used: number;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    fetchTeamData();
  }, [user, navigate]);

  const fetchTeamData = async () => {
    if (!user?.email) return;

    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('leader_email', user.email)
        .single();

      if (error) {
        toast({
          variant: "destructive",
          title: "Error loading team data",
          description: error.message,
        });
      } else {
        setTeam(data);
      }
    } catch (error) {
      console.error('Error fetching team:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center space-y-4">
          <Compass className="h-12 w-12 text-primary mx-auto animate-spin" />
          <p className="text-foreground">Loading your team data...</p>
        </div>
      </div>
    );
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'completed': return 'secondary';
      case 'pending': return 'outline';
      case 'disqualified': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6 border-b border-border">
        <div className="flex items-center space-x-2">
          <Compass className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Campus Treasure Hunt</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/leaderboard')}
            className="glass-card"
          >
            <Trophy className="h-4 w-4 mr-2" />
            Leaderboard
          </Button>
          <Button 
            variant="outline" 
            onClick={handleSignOut}
            className="glass-card"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        {team ? (
          <div className="space-y-8">
            {/* Team Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="glass-card border-glass-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Users className="h-5 w-5 text-primary" />
                    Team Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{team.name}</h3>
                    <Badge variant={getStatusBadgeVariant(team.status)} className="mt-1">
                      {team.status.charAt(0).toUpperCase() + team.status.slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Team Members:</p>
                    <ul className="text-sm text-foreground">
                      {team.member_names.map((member, index) => (
                        <li key={index}>• {member}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-glass-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Trophy className="h-5 w-5 text-warning" />
                    Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{team.current_score}</div>
                  <p className="text-sm text-muted-foreground">Total Points</p>
                </CardContent>
              </Card>

              <Card className="glass-card border-glass-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <HelpCircle className="h-5 w-5 text-accent" />
                    Help Tokens
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {3 - team.help_tokens_used}
                  </div>
                  <p className="text-sm text-muted-foreground">Remaining</p>
                </CardContent>
              </Card>
            </div>

            {/* Game Status */}
            {team.status === 'pending' && (
              <Card className="glass-card border-glass-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Waiting for Game to Start</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Your team is registered and ready! The treasure hunt will begin soon.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2 text-warning">
                    <div className="w-3 h-3 bg-warning rounded-full animate-pulse"></div>
                    <span className="text-sm">Standby - Game starting soon</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {team.status === 'active' && (
              <Card className="glass-card border-glass-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <MapPin className="h-5 w-5 text-primary" />
                    Current Checkpoint
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Your next location and riddle will appear here
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <MapPin className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">No active checkpoint available</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Check back soon or contact game administrators
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {team.status === 'completed' && (
              <Card className="glass-card border-glass-border bg-gradient-success">
                <CardHeader>
                  <CardTitle className="text-white">🎉 Congratulations!</CardTitle>
                  <CardDescription className="text-green-100">
                    Your team has completed the treasure hunt!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-white">
                    Final Score: <span className="font-bold text-2xl">{team.current_score}</span>
                  </p>
                  <Button 
                    className="mt-4" 
                    variant="secondary"
                    onClick={() => navigate('/leaderboard')}
                  >
                    View Final Rankings
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card className="glass-card border-glass-border max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-foreground">No Team Found</CardTitle>
              <CardDescription className="text-muted-foreground">
                You don't appear to be registered for any team.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full bg-gradient-primary hover:glow-primary transition-glow"
                onClick={() => navigate('/register')}
              >
                Register Your Team
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;