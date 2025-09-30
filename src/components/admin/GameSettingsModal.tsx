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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Settings, Save, RefreshCw } from 'lucide-react';

interface GameSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  description: string | null;
}

interface GameSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GameSettingsModal = ({ isOpen, onClose }: GameSettingsModalProps) => {
  const [settings, setSettings] = useState<GameSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Local state for form values
  const [gameActive, setGameActive] = useState(false);
  const [maxTeams, setMaxTeams] = useState('50');
  const [maxTimeMinutes, setMaxTimeMinutes] = useState('180');
  const [helpTokensPerTeam, setHelpTokensPerTeam] = useState('3');

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('game_settings')
        .select('*')
        .order('setting_key');

      if (error) throw error;
      
      setSettings(data || []);
      
      // Update local state from loaded settings
      data?.forEach((setting) => {
        switch (setting.setting_key) {
          case 'game_active':
            setGameActive(setting.setting_value === 'true');
            break;
          case 'max_teams':
            setMaxTeams(setting.setting_value);
            break;
          case 'max_time_minutes':
            setMaxTimeMinutes(setting.setting_value);
            break;
          case 'help_tokens_per_team':
            setHelpTokensPerTeam(setting.setting_value);
            break;
        }
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error loading settings',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: string) => {
    const { error } = await supabase
      .from('game_settings')
      .update({ setting_value: value })
      .eq('setting_key', key);

    if (error) throw error;
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Update all settings
      await Promise.all([
        updateSetting('game_active', gameActive.toString()),
        updateSetting('max_teams', maxTeams),
        updateSetting('max_time_minutes', maxTimeMinutes),
        updateSetting('help_tokens_per_team', helpTokensPerTeam),
      ]);

      toast({
        title: 'Settings saved',
        description: 'Game settings have been updated successfully.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Save failed',
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Game Settings
          </DialogTitle>
          <DialogDescription>
            Configure game parameters and rules for the treasure hunt
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">Loading settings...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Game Control</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="game-active" className="text-base font-medium">
                      Game Active
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Enable or disable the treasure hunt for all players
                    </p>
                  </div>
                  <Switch
                    id="game-active"
                    checked={gameActive}
                    onCheckedChange={setGameActive}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Game Limits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="max-teams">Maximum Teams</Label>
                    <Input
                      id="max-teams"
                      type="number"
                      min="1"
                      max="1000"
                      value={maxTeams}
                      onChange={(e) => setMaxTeams(e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Maximum number of teams allowed to register
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="max-time">Time Limit (minutes)</Label>
                    <Input
                      id="max-time"
                      type="number"
                      min="30"
                      max="720"
                      value={maxTimeMinutes}
                      onChange={(e) => setMaxTimeMinutes(e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Maximum time allowed for the hunt
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="help-tokens">Help Tokens per Team</Label>
                    <Input
                      id="help-tokens"
                      type="number"
                      min="0"
                      max="10"
                      value={helpTokensPerTeam}
                      onChange={(e) => setHelpTokensPerTeam(e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Number of help tokens each team gets
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Game Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-foreground">
                      {gameActive ? 'Active' : 'Inactive'}
                    </div>
                    <div className="text-sm text-muted-foreground">Game Status</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-foreground">{maxTeams}</div>
                    <div className="text-sm text-muted-foreground">Max Teams</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-foreground">{maxTimeMinutes}</div>
                    <div className="text-sm text-muted-foreground">Time Limit</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-foreground">{helpTokensPerTeam}</div>
                    <div className="text-sm text-muted-foreground">Help Tokens</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={loadSettings} disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={saveSettings} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GameSettingsModal;