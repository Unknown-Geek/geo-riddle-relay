import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Compass, Trophy, Medal, Award, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TeamRanking {
  id: string;
  name: string;
  current_score: number;
  status: string;
  member_names: string[];
  team_color: string;
}

const Leaderboard = () => {
  const [teams, setTeams] = useState<TeamRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, current_score, status, member_names, team_color')
        .order('current_score', { ascending: false });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error loading leaderboard",
          description: error.message,
        });
      } else {
        setTeams(data || []);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">{position}</span>;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'completed': return 'secondary';
      case 'pending': return 'outline';
      case 'disqualified': return 'destructive';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center space-y-4">
          <Trophy className="h-12 w-12 text-primary mx-auto animate-pulse" />
          <p className="text-foreground">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6 border-b border-border">
        <Link to="/" className="flex items-center space-x-2">
          <ArrowLeft className="h-5 w-5 text-primary" />
          <Compass className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Campus Treasure Hunt</h1>
        </Link>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-foreground mb-2">🏆 Leaderboard</h2>
          <p className="text-muted-foreground">
            See how all teams are performing in the treasure hunt
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {teams.length === 0 ? (
            <Card className="glass-card border-glass-border text-center">
              <CardHeader>
                <CardTitle className="text-foreground">No Teams Yet</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Be the first to register for the treasure hunt!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/register">
                  <Button className="bg-gradient-primary hover:glow-primary transition-glow">
                    Register Your Team
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {teams.map((team, index) => {
                const position = index + 1;
                const isTopThree = position <= 3;
                
                return (
                  <Card 
                    key={team.id} 
                    className={`glass-card border-glass-border ${
                      isTopThree ? 'glow-primary' : ''
                    } transition-glow`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {/* Rank */}
                          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
                            {getRankIcon(position)}
                          </div>
                          
                          {/* Team Info */}
                          <div className="space-y-1">
                            <div className="flex items-center space-x-3">
                              <h3 className="text-xl font-bold text-foreground">{team.name}</h3>
                              <div 
                                className="w-4 h-4 rounded-full border-2 border-border"
                                style={{ backgroundColor: team.team_color }}
                              ></div>
                              <Badge variant={getStatusBadgeVariant(team.status)}>
                                {team.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {team.member_names.length} member{team.member_names.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>

                        {/* Score */}
                        <div className="text-right">
                          <div className="text-3xl font-bold text-foreground">
                            {team.current_score}
                          </div>
                          <p className="text-sm text-muted-foreground">points</p>
                        </div>
                      </div>

                      {/* Team Members */}
                      {isTopThree && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <p className="text-xs text-muted-foreground mb-2">Team Members:</p>
                          <div className="flex flex-wrap gap-2">
                            {team.member_names.map((member, memberIndex) => (
                              <Badge key={memberIndex} variant="outline" className="text-xs">
                                {member}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="mt-8 text-center">
            <Link to="/">
              <Button variant="outline" className="glass-card">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;