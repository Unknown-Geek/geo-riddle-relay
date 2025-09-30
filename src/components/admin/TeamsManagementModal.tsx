import { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, Mail, Trophy, Clock, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Team {
  id: string;
  name: string;
  leader_email: string;
  member_names: string[];
  status: 'pending' | 'active' | 'completed' | 'disqualified';
  current_score: number;
  created_at: string;
  completed_at?: string;
  help_tokens_used: number;
}

interface TeamsManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TeamsManagementModal = ({ isOpen, onClose }: TeamsManagementModalProps) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadTeams = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('current_score', { ascending: false });

      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Error loading teams:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load teams',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTeams();
    }
  }, [isOpen]);

  const updateTeamStatus = async (teamId: string, newStatus: Team['status']) => {
    try {
      const { error } = await supabase
        .from('teams')
        .update({ 
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', teamId);

      if (error) throw error;

      setTeams(teams.map(team => 
        team.id === teamId 
          ? { 
              ...team, 
              status: newStatus, 
              completed_at: newStatus === 'completed' ? new Date().toISOString() : undefined 
            }
          : team
      ));

      toast({
        title: 'Success',
        description: `Team status updated to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating team status:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update team status',
      });
    }
  };

  const deleteTeam = async (teamId: string, teamName: string) => {
    if (!confirm(`Are you sure you want to delete team "${teamName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;

      setTeams(teams.filter(team => team.id !== teamId));
      toast({
        title: 'Success',
        description: `Team "${teamName}" deleted successfully`,
      });
    } catch (error) {
      console.error('Error deleting team:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete team',
      });
    }
  };

  const getStatusColor = (status: Team['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'pending': return 'bg-yellow-500';
      case 'disqualified': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Teams Management
          </DialogTitle>
          <DialogDescription>
            View and manage all registered teams
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Total Teams: {teams.length}
              </p>
              <Button onClick={loadTeams} variant="outline" size="sm">
                Refresh
              </Button>
            </div>

            {teams.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center p-8">
                  <p className="text-muted-foreground">No teams registered yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {teams.map((team) => (
                  <Card key={team.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{team.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(team.status)}>
                            {team.status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTeam(team.id, team.name)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{team.leader_email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {team.member_names.length} members
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Members: {team.member_names.join(', ')}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              Score: {team.current_score}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              Registered: {new Date(team.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {team.completed_at && (
                            <div className="text-sm text-muted-foreground">
                              Completed: {new Date(team.completed_at).toLocaleString()}
                            </div>
                          )}
                          <div className="text-sm text-muted-foreground">
                            Help tokens used: {team.help_tokens_used}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Status:</span>
                        <Select
                          value={team.status}
                          onValueChange={(value: Team['status']) => 
                            updateTeamStatus(team.id, value)
                          }
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="disqualified">Disqualified</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TeamsManagementModal;