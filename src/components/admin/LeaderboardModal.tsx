import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Users, Clock, Target, RefreshCw } from 'lucide-react';

interface LeaderboardTeam {
  id: string;
  name: string;
  leader_email: string;
  current_score: number | null;
  status: 'pending' | 'active' | 'completed' | 'disqualified' | null;
  completed_at: string | null;
  help_tokens_used: number | null;
  member_names: string[];
}

interface Submission {
  id: string;
  team_id: string;
  submitted_at: string;
  status: 'correct' | 'incorrect' | 'invalid';
  points_awarded: number;
  riddle_id: string;
  riddles?: {
    question: string;
    checkpoint_id: string;
    checkpoints?: {
      name: string;
    };
  };
}

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LeaderboardModal = ({ isOpen, onClose }: LeaderboardModalProps) => {
  const [teams, setTeams] = useState<LeaderboardTeam[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadLeaderboard();
    }
  }, [isOpen]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      // Load teams with scores
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .order('current_score', { ascending: false });

      if (teamsError) throw teamsError;
      setTeams(teamsData || []);

      // Load recent submissions for activity feed
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('submissions')
        .select(`
          *,
          riddles(
            question,
            checkpoint_id,
            checkpoints(name)
          )
        `)
        .order('submitted_at', { ascending: false })
        .limit(10);

      if (submissionsError) throw submissionsError;
      setSubmissions(submissionsData || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error loading leaderboard',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'text-yellow-500'; // Gold
      case 2:
        return 'text-gray-400'; // Silver
      case 3:
        return 'text-amber-600'; // Bronze
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'completed':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'disqualified':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getSubmissionStatusColor = (status: string) => {
    switch (status) {
      case 'correct':
        return 'text-green-600 bg-green-50';
      case 'incorrect':
        return 'text-red-600 bg-red-50';
      case 'invalid':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Live Leaderboard
          </DialogTitle>
          <DialogDescription>
            Real-time team rankings and recent activity
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">Loading leaderboard...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Leaderboard */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Team Rankings</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadLeaderboard}
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {teams.length === 0 ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <Trophy className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">No teams registered yet</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {teams.map((team, index) => (
                    <Card 
                      key={team.id} 
                      className={`cursor-pointer transition-all ${
                        selectedTeam === team.id ? 'ring-2 ring-primary' : 'hover:shadow-md'
                      }`}
                      onClick={() => setSelectedTeam(selectedTeam === team.id ? null : team.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`text-xl font-bold ${getRankColor(index + 1)}`}>
                              #{index + 1}
                            </div>
                            <div>
                              <h4 className="font-semibold">{team.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {team.member_names.length} members
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-lg font-bold">{team.current_score || 0}</div>
                              <div className="text-sm text-muted-foreground">points</div>
                            </div>
                            <Badge className={getStatusColor(team.status)}>
                              {team.status || 'pending'}
                            </Badge>
                          </div>
                        </div>
                        {selectedTeam === team.id && (
                          <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Leader:</span> {team.leader_email}
                            </div>
                            <div>
                              <span className="font-medium">Help tokens used:</span> {team.help_tokens_used || 0}
                            </div>
                            <div>
                              <span className="font-medium">Members:</span> {team.member_names.join(', ')}
                            </div>
                            {team.completed_at && (
                              <div>
                                <span className="font-medium">Completed:</span>{' '}
                                {new Date(team.completed_at).toLocaleString()}
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              
              {submissions.length === 0 ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <Clock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No activity yet</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {submissions.map((submission) => {
                    const team = teams.find(t => t.id === submission.team_id);
                    return (
                      <Card key={submission.id} className="border-l-4 border-l-primary/20">
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge 
                                  className={`text-xs ${getSubmissionStatusColor(submission.status)}`}
                                  variant="outline"
                                >
                                  {submission.status}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  +{submission.points_awarded} pts
                                </span>
                              </div>
                              <p className="text-sm font-medium">{team?.name || 'Unknown Team'}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {submission.riddles?.checkpoints?.name || 'Unknown Checkpoint'}
                              </p>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(submission.submitted_at).toLocaleTimeString()}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LeaderboardModal;