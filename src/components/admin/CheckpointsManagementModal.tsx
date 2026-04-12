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
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { MapPin, Plus, Trash2, RefreshCw, ChevronDown, ChevronUp, Edit2, Save, X } from 'lucide-react';
import type { CheckpointRow, RiddleRow } from '@/services/admin/admin-service';

interface CheckpointsManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const emptyCheckpoint = {
  name: '',
  description: '',
  latitude: 0,
  longitude: 0,
  radius_meters: 50,
  order_number: 1,
  clue_text: '',
  help_token_hint: '',
  is_active: true,
};

const emptyRiddle = {
  question: '',
  correct_answer: '',
  max_points: 100,
  time_penalty_per_minute: 5,
  order_number: 1,
  is_active: true,
};

const CheckpointsManagementModal = ({ isOpen, onClose }: CheckpointsManagementModalProps) => {
  const [checkpoints, setCheckpoints] = useState<(CheckpointRow & { riddles?: RiddleRow[] })[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedCheckpoint, setExpandedCheckpoint] = useState<string | null>(null);
  const [editingCheckpoint, setEditingCheckpoint] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<CheckpointRow>>({});
  const [showNewCheckpoint, setShowNewCheckpoint] = useState(false);
  const [newCheckpoint, setNewCheckpoint] = useState(emptyCheckpoint);
  const [showNewRiddle, setShowNewRiddle] = useState<string | null>(null);
  const [newRiddle, setNewRiddle] = useState(emptyRiddle);
  const [editingRiddle, setEditingRiddle] = useState<string | null>(null);
  const [editRiddleData, setEditRiddleData] = useState<Partial<RiddleRow>>({});
  const { toast } = useToast();

  const loadCheckpoints = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('checkpoints')
        .select('*, riddles(*)')
        .order('order_number', { ascending: true });

      if (error) throw error;
      setCheckpoints(data || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error loading checkpoints',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCheckpoints();
    }
  }, [isOpen]);

  const handleCreateCheckpoint = async () => {
    try {
      const { data, error } = await supabase
        .from('checkpoints')
        .insert(newCheckpoint)
        .select('*, riddles(*)')
        .single();

      if (error) throw error;

      setCheckpoints([...checkpoints, data]);
      setShowNewCheckpoint(false);
      setNewCheckpoint(emptyCheckpoint);
      toast({ title: 'Success', description: 'Checkpoint created successfully.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleUpdateCheckpoint = async (id: string) => {
    try {
      const { error } = await supabase
        .from('checkpoints')
        .update(editData)
        .eq('id', id);

      if (error) throw error;

      setCheckpoints(checkpoints.map(c => c.id === id ? { ...c, ...editData } as any : c));
      setEditingCheckpoint(null);
      setEditData({});
      toast({ title: 'Success', description: 'Checkpoint updated.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleDeleteCheckpoint = async (id: string, name: string) => {
    if (!confirm(`Delete checkpoint "${name}" and all its riddles?`)) return;
    try {
      const { error } = await supabase.from('checkpoints').delete().eq('id', id);
      if (error) throw error;
      setCheckpoints(checkpoints.filter(c => c.id !== id));
      toast({ title: 'Deleted', description: `Checkpoint "${name}" deleted.` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleToggleCheckpoint = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('checkpoints')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;

      setCheckpoints(checkpoints.map(c =>
        c.id === id ? { ...c, is_active: !isActive } : c
      ));
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleCreateRiddle = async (checkpointId: string) => {
    try {
      const { data, error } = await supabase
        .from('riddles')
        .insert({ ...newRiddle, checkpoint_id: checkpointId })
        .select()
        .single();

      if (error) throw error;

      setCheckpoints(checkpoints.map(c =>
        c.id === checkpointId
          ? { ...c, riddles: [...(c.riddles || []), data] }
          : c
      ));
      setShowNewRiddle(null);
      setNewRiddle(emptyRiddle);
      toast({ title: 'Success', description: 'Riddle created.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleUpdateRiddle = async (riddleId: string, checkpointId: string) => {
    try {
      const { error } = await supabase
        .from('riddles')
        .update(editRiddleData)
        .eq('id', riddleId);

      if (error) throw error;

      setCheckpoints(checkpoints.map(c =>
        c.id === checkpointId
          ? {
              ...c,
              riddles: (c.riddles || []).map(r =>
                r.id === riddleId ? { ...r, ...editRiddleData } : r
              ),
            }
          : c
      ));
      setEditingRiddle(null);
      setEditRiddleData({});
      toast({ title: 'Success', description: 'Riddle updated.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleDeleteRiddle = async (riddleId: string, checkpointId: string) => {
    try {
      const { error } = await supabase.from('riddles').delete().eq('id', riddleId);
      if (error) throw error;

      setCheckpoints(checkpoints.map(c =>
        c.id === checkpointId
          ? { ...c, riddles: (c.riddles || []).filter(r => r.id !== riddleId) }
          : c
      ));
      toast({ title: 'Deleted', description: 'Riddle deleted.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Checkpoints & Riddles
          </DialogTitle>
          <DialogDescription>
            Configure game locations and questions
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Total Checkpoints: {checkpoints.length}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={loadCheckpoints}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                </Button>
                <Button size="sm" onClick={() => setShowNewCheckpoint(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Add Checkpoint
                </Button>
              </div>
            </div>

            {/* New Checkpoint Form */}
            {showNewCheckpoint && (
              <Card className="border-primary/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">New Checkpoint</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={newCheckpoint.name}
                        onChange={e => setNewCheckpoint({ ...newCheckpoint, name: e.target.value })}
                        placeholder="e.g. Main Library"
                      />
                    </div>
                    <div>
                      <Label>Order Number</Label>
                      <Input
                        type="number"
                        value={newCheckpoint.order_number}
                        onChange={e => setNewCheckpoint({ ...newCheckpoint, order_number: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    <div>
                      <Label>Latitude</Label>
                      <Input
                        type="number"
                        step="any"
                        value={newCheckpoint.latitude}
                        onChange={e => setNewCheckpoint({ ...newCheckpoint, latitude: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>Longitude</Label>
                      <Input
                        type="number"
                        step="any"
                        value={newCheckpoint.longitude}
                        onChange={e => setNewCheckpoint({ ...newCheckpoint, longitude: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>Radius (meters)</Label>
                      <Input
                        type="number"
                        value={newCheckpoint.radius_meters}
                        onChange={e => setNewCheckpoint({ ...newCheckpoint, radius_meters: parseInt(e.target.value) || 50 })}
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input
                        value={newCheckpoint.description}
                        onChange={e => setNewCheckpoint({ ...newCheckpoint, description: e.target.value })}
                        placeholder="Optional description"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Clue Text</Label>
                    <Input
                      value={newCheckpoint.clue_text}
                      onChange={e => setNewCheckpoint({ ...newCheckpoint, clue_text: e.target.value })}
                      placeholder="The clue that leads to this checkpoint"
                    />
                  </div>
                  <div>
                    <Label>Help Token Hint</Label>
                    <Input
                      value={newCheckpoint.help_token_hint}
                      onChange={e => setNewCheckpoint({ ...newCheckpoint, help_token_hint: e.target.value })}
                      placeholder="Hint revealed when a help token is used"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleCreateCheckpoint}>Create</Button>
                    <Button size="sm" variant="outline" onClick={() => setShowNewCheckpoint(false)}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Checkpoint List */}
            {checkpoints.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">No checkpoints created yet</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {checkpoints.map((checkpoint) => (
                  <Card key={checkpoint.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedCheckpoint(
                              expandedCheckpoint === checkpoint.id ? null : checkpoint.id
                            )}
                          >
                            {expandedCheckpoint === checkpoint.id
                              ? <ChevronUp className="h-4 w-4" />
                              : <ChevronDown className="h-4 w-4" />}
                          </Button>
                          <div>
                            <CardTitle className="text-base flex items-center gap-2">
                              #{checkpoint.order_number} {checkpoint.name}
                              <Badge variant={checkpoint.is_active ? 'default' : 'outline'}>
                                {checkpoint.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">
                              {checkpoint.latitude.toFixed(6)}, {checkpoint.longitude.toFixed(6)} | {checkpoint.radius_meters}m radius
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={checkpoint.is_active ?? true}
                            onCheckedChange={() => handleToggleCheckpoint(checkpoint.id, checkpoint.is_active ?? true)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingCheckpoint(checkpoint.id);
                              setEditData(checkpoint);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500"
                            onClick={() => handleDeleteCheckpoint(checkpoint.id, checkpoint.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    {(expandedCheckpoint === checkpoint.id || editingCheckpoint === checkpoint.id) && (
                      <CardContent className="space-y-4">
                        {editingCheckpoint === checkpoint.id ? (
                          <div className="space-y-3 p-3 bg-muted/20 rounded-lg">
                            <p className="text-sm font-medium">Edit Checkpoint</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs">Name</Label>
                                <Input
                                  value={editData.name || ''}
                                  onChange={e => setEditData({ ...editData, name: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Order</Label>
                                <Input
                                  type="number"
                                  value={editData.order_number || 1}
                                  onChange={e => setEditData({ ...editData, order_number: parseInt(e.target.value) || 1 })}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Latitude</Label>
                                <Input
                                  type="number"
                                  step="any"
                                  value={editData.latitude || 0}
                                  onChange={e => setEditData({ ...editData, latitude: parseFloat(e.target.value) || 0 })}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Longitude</Label>
                                <Input
                                  type="number"
                                  step="any"
                                  value={editData.longitude || 0}
                                  onChange={e => setEditData({ ...editData, longitude: parseFloat(e.target.value) || 0 })}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Radius (m)</Label>
                                <Input
                                  type="number"
                                  value={editData.radius_meters || 50}
                                  onChange={e => setEditData({ ...editData, radius_meters: parseInt(e.target.value) || 50 })}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Clue Text</Label>
                                <Input
                                  value={editData.clue_text || ''}
                                  onChange={e => setEditData({ ...editData, clue_text: e.target.value })}
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleUpdateCheckpoint(checkpoint.id)}>
                                <Save className="h-4 w-4 mr-1" /> Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => { setEditingCheckpoint(null); setEditData({}); }}>
                                <X className="h-4 w-4 mr-1" /> Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm space-y-1">
                            <p><strong>Clue:</strong> {checkpoint.clue_text}</p>
                            {checkpoint.description && <p><strong>Description:</strong> {checkpoint.description}</p>}
                            {checkpoint.help_token_hint && <p><strong>Help hint:</strong> {checkpoint.help_token_hint}</p>}
                          </div>
                        )}

                        {/* Riddles */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                              Riddles ({checkpoint.riddles?.length || 0})
                            </h4>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setShowNewRiddle(checkpoint.id);
                                setNewRiddle(emptyRiddle);
                              }}
                            >
                              <Plus className="h-3 w-3 mr-1" /> Add Riddle
                            </Button>
                          </div>

                          {showNewRiddle === checkpoint.id && (
                            <Card className="border-accent/30 bg-accent/5">
                              <CardContent className="p-3 space-y-3">
                                <div>
                                  <Label className="text-xs">Question</Label>
                                  <Input
                                    value={newRiddle.question}
                                    onChange={e => setNewRiddle({ ...newRiddle, question: e.target.value })}
                                    placeholder="Enter the riddle question"
                                  />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <Label className="text-xs">Correct Answer</Label>
                                    <Input
                                      value={newRiddle.correct_answer}
                                      onChange={e => setNewRiddle({ ...newRiddle, correct_answer: e.target.value })}
                                      placeholder="Answer (case-insensitive match)"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Max Points</Label>
                                    <Input
                                      type="number"
                                      value={newRiddle.max_points}
                                      onChange={e => setNewRiddle({ ...newRiddle, max_points: parseInt(e.target.value) || 100 })}
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Order Number</Label>
                                    <Input
                                      type="number"
                                      value={newRiddle.order_number}
                                      onChange={e => setNewRiddle({ ...newRiddle, order_number: parseInt(e.target.value) || 1 })}
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Time Penalty/min</Label>
                                    <Input
                                      type="number"
                                      value={newRiddle.time_penalty_per_minute}
                                      onChange={e => setNewRiddle({ ...newRiddle, time_penalty_per_minute: parseInt(e.target.value) || 5 })}
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => handleCreateRiddle(checkpoint.id)}>Create</Button>
                                  <Button size="sm" variant="outline" onClick={() => setShowNewRiddle(null)}>Cancel</Button>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {(checkpoint.riddles || []).map((riddle) => (
                            <Card key={riddle.id} className="bg-muted/10">
                              <CardContent className="p-3">
                                {editingRiddle === riddle.id ? (
                                  <div className="space-y-3">
                                    <div>
                                      <Label className="text-xs">Question</Label>
                                      <Input
                                        value={editRiddleData.question || ''}
                                        onChange={e => setEditRiddleData({ ...editRiddleData, question: e.target.value })}
                                      />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <Label className="text-xs">Correct Answer</Label>
                                        <Input
                                          value={editRiddleData.correct_answer || ''}
                                          onChange={e => setEditRiddleData({ ...editRiddleData, correct_answer: e.target.value })}
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-xs">Max Points</Label>
                                        <Input
                                          type="number"
                                          value={editRiddleData.max_points || 100}
                                          onChange={e => setEditRiddleData({ ...editRiddleData, max_points: parseInt(e.target.value) || 100 })}
                                        />
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button size="sm" onClick={() => handleUpdateRiddle(riddle.id, checkpoint.id)}>
                                        <Save className="h-4 w-4 mr-1" /> Save
                                      </Button>
                                      <Button size="sm" variant="outline" onClick={() => { setEditingRiddle(null); setEditRiddleData({}); }}>
                                        <X className="h-4 w-4 mr-1" /> Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                      <p className="text-sm font-medium">Riddle #{riddle.order_number || 1}</p>
                                      <p className="text-sm text-muted-foreground">{riddle.question}</p>
                                      <div className="flex gap-2 text-xs text-muted-foreground">
                                        <span>Answer: <strong>{riddle.correct_answer}</strong></span>
                                        <span>|</span>
                                        <span>{riddle.max_points} pts</span>
                                        <span>|</span>
                                        <Badge variant={riddle.is_active ? 'default' : 'outline'} className="text-[10px]">
                                          {riddle.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                      </div>
                                    </div>
                                    <div className="flex gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setEditingRiddle(riddle.id);
                                          setEditRiddleData(riddle);
                                        }}
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500"
                                        onClick={() => handleDeleteRiddle(riddle.id, checkpoint.id)}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    )}
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

export default CheckpointsManagementModal;
