import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Compass, Trophy, Medal, Award, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getLeaderboard, subscribeToLeaderboard, type TeamRow } from '@/services/player-service';

type TeamRanking = Pick<TeamRow, 'id' | 'name' | 'current_score' | 'status' | 'member_names' | 'team_color' | 'avatar_url'>;

const Leaderboard = () => {
  const [teams, setTeams] = useState<TeamRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getLeaderboard();
        setTeams(data ?? []);
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error loading leaderboard',
          description: error?.message ?? 'Please try again.',
        });
      } finally {
        setLoading(false);
      }
    };

    load();

    const unsubscribe = subscribeToLeaderboard(() => {
      load();
    });

    return unsubscribe;
  }, [toast]);

  const fetchLeaderboard = async () => {
    try {
      const data = await getLeaderboard();
      setTeams(data ?? []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error refreshing leaderboard',
        description: error?.message ?? 'Please try again.',
      });
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
                              <Avatar className="h-10 w-10 border"
                                style={{ borderColor: team.team_color ?? '#00d9ff' }}>
                                {team.avatar_url ? (
                                  <AvatarImage src={team.avatar_url} alt={team.name} />
                                ) : (
                                  <AvatarFallback>
                                    {team.name
                                      .split(' ')
                                      .map((n) => n[0])
                                      .join('')
                                      .slice(0, 2)
                                      .toUpperCase()}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
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

          <div className="mt-8 text-center flex justify-center gap-3">
            <Link to="/">
              <Button variant="outline" className="glass-card">
                Back to Home
              </Button>
            </Link>
            <Button variant="ghost" onClick={fetchLeaderboard} className="glass-card">
              Refresh
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;