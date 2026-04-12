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
import { Card, CardContent } from '@/components/ui/card';
import { Activity, RefreshCw, Filter } from 'lucide-react';
import type { ActivityLogRow } from '@/services/admin/admin-service';

interface ActivityLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const actionTypeColor: Record<string, string> = {
  login: 'bg-blue-500',
  logout: 'bg-gray-500',
  submission: 'bg-green-500',
  help_token: 'bg-yellow-500',
  admin_action: 'bg-purple-500',
  game_start: 'bg-emerald-500',
  game_stop: 'bg-red-500',
  team_register: 'bg-cyan-500',
  team_update: 'bg-orange-500',
  score_reset: 'bg-red-600',
};

const ActivityLogsModal = ({ isOpen, onClose }: ActivityLogsModalProps) => {
  const [logs, setLogs] = useState<ActivityLogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const { toast } = useToast();

  const loadLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filterType !== 'all') {
        query = query.eq('action_type', filterType);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error loading logs',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen, filterType]);

  const uniqueActionTypes = [...new Set(logs.map(l => l.action_type))];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Logs
          </DialogTitle>
          <DialogDescription>
            Review submission logs and security events
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className="text-sm border rounded px-2 py-1 bg-background"
                >
                  <option value="all">All Types</option>
                  {uniqueActionTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">{logs.length} log entries</p>
                <Button variant="outline" size="sm" onClick={loadLogs}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                </Button>
              </div>
            </div>

            {logs.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Activity className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">No activity logs found</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <Card key={log.id} className="overflow-hidden">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              className={`text-xs ${actionTypeColor[log.action_type] || 'bg-gray-500'}`}
                            >
                              {log.action_type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {log.created_at ? new Date(log.created_at).toLocaleString() : 'Unknown time'}
                            </span>
                          </div>
                          <p className="text-sm text-foreground break-words">{log.description}</p>
                          {log.metadata && typeof log.metadata === 'object' && (
                            <details className="mt-1">
                              <summary className="text-xs text-muted-foreground cursor-pointer">Metadata</summary>
                              <pre className="text-xs text-muted-foreground mt-1 overflow-x-auto">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                        <div className="text-right text-xs text-muted-foreground shrink-0">
                          {log.team_id && <p>Team: {log.team_id.slice(0, 8)}...</p>}
                          {log.admin_id && <p>Admin: {log.admin_id.slice(0, 8)}...</p>}
                          {log.ip_address && <p>IP: {String(log.ip_address)}</p>}
                        </div>
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

export default ActivityLogsModal;
