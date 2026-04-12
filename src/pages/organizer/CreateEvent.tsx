import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, ArrowRight, Check, MapPin, Plus, Trash2,
  GripVertical, HelpCircle, Settings
} from "lucide-react";
import { createEvent, createCheckpoint, createRiddle } from "@/services/organizer-service";
import { useToast } from "@/hooks/use-toast";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, Breadcrumbs } from "@/components/layout/PageHeader";

interface CheckpointDraft {
  name: string;
  description: string;
  latitude: string;
  longitude: string;
  radiusMeters: string;
  clueText: string;
  helpTokenHint: string;
  riddles: { question: string; correctAnswer: string; maxPoints: string }[];
}

const STEPS = ["Details", "Checkpoints", "Settings", "Review"];

const CreateEvent = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 1: Event details
  const [eventName, setEventName] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");

  // Step 2: Checkpoints
  const [checkpoints, setCheckpoints] = useState<CheckpointDraft[]>([
    {
      name: "", description: "", latitude: "", longitude: "",
      radiusMeters: "50", clueText: "", helpTokenHint: "",
      riddles: [{ question: "", correctAnswer: "", maxPoints: "100" }],
    },
  ]);

  // Step 3: Settings
  const [helpTokens, setHelpTokens] = useState("3");
  const [maxTeams, setMaxTeams] = useState("50");
  const [maxTimeMinutes, setMaxTimeMinutes] = useState("180");
  const [timePenalty, setTimePenalty] = useState("5");

  const addCheckpoint = () => {
    setCheckpoints(prev => [
      ...prev,
      {
        name: "", description: "", latitude: "", longitude: "",
        radiusMeters: "50", clueText: "", helpTokenHint: "",
        riddles: [{ question: "", correctAnswer: "", maxPoints: "100" }],
      },
    ]);
  };

  const removeCheckpoint = (index: number) => {
    setCheckpoints(prev => prev.filter((_, i) => i !== index));
  };

  const updateCheckpoint = (index: number, field: keyof CheckpointDraft, value: string) => {
    setCheckpoints(prev => prev.map((cp, i) => i === index ? { ...cp, [field]: value } : cp));
  };

  const addRiddle = (cpIndex: number) => {
    setCheckpoints(prev => prev.map((cp, i) =>
      i === cpIndex
        ? { ...cp, riddles: [...cp.riddles, { question: "", correctAnswer: "", maxPoints: "100" }] }
        : cp
    ));
  };

  const updateRiddle = (cpIndex: number, rIndex: number, field: string, value: string) => {
    setCheckpoints(prev => prev.map((cp, i) =>
      i === cpIndex
        ? {
            ...cp,
            riddles: cp.riddles.map((r, ri) =>
              ri === rIndex ? { ...r, [field]: value } : r
            ),
          }
        : cp
    ));
  };

  const removeRiddle = (cpIndex: number, rIndex: number) => {
    setCheckpoints(prev => prev.map((cp, i) =>
      i === cpIndex
        ? { ...cp, riddles: cp.riddles.filter((_, ri) => ri !== rIndex) }
        : cp
    ));
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Create event
      const event = await createEvent({
        name: eventName,
        description: eventDescription || undefined,
        coverImageUrl: coverImageUrl || undefined,
        organizerId: user.id,
        settings: {
          help_tokens_per_team: parseInt(helpTokens) || 3,
          max_teams: parseInt(maxTeams) || 50,
          max_time_minutes: parseInt(maxTimeMinutes) || 180,
          time_penalty_per_minute: parseInt(timePenalty) || 5,
        },
      });

      // Create checkpoints and riddles
      for (let i = 0; i < checkpoints.length; i++) {
        const cp = checkpoints[i];
        if (!cp.name || !cp.latitude || !cp.longitude || !cp.clueText) continue;

        const checkpoint = await createCheckpoint({
          eventId: event.id,
          name: cp.name,
          description: cp.description || undefined,
          latitude: parseFloat(cp.latitude),
          longitude: parseFloat(cp.longitude),
          radiusMeters: parseInt(cp.radiusMeters) || 50,
          orderNumber: i + 1,
          clueText: cp.clueText,
          helpTokenHint: cp.helpTokenHint || undefined,
        });

        for (const riddle of cp.riddles) {
          if (!riddle.question || !riddle.correctAnswer) continue;
          await createRiddle({
            checkpointId: checkpoint.id,
            question: riddle.question,
            correctAnswer: riddle.correctAnswer,
            maxPoints: parseInt(riddle.maxPoints) || 100,
            orderNumber: cp.riddles.indexOf(riddle) + 1,
          });
        }
      }

      toast({
        title: "Event created!",
        description: `Invite code: ${event.invite_code}`,
      });

      navigate(`/organize/${event.slug}`);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to create event",
        description: err.message ?? "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 0) return eventName.trim().length > 0;
    if (step === 1) return checkpoints.some(cp => cp.name && cp.latitude && cp.longitude && cp.clueText);
    return true;
  };

  return (
    <AppShell role="organizer">
      <div className="p-4 sm:p-6 space-y-6 max-w-2xl mx-auto">
        <Breadcrumbs items={[
          { label: "Events", href: "/organize" },
          { label: "New event" },
        ]} />

        {/* Progress */}
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <button
                onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition-colors ${
                  i === step
                    ? "bg-primary text-primary-foreground"
                    : i < step
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {i < step ? <Check className="h-3 w-3" /> : <span>{i + 1}</span>}
                <span className="hidden sm:inline">{s}</span>
              </button>
              {i < STEPS.length - 1 && <div className="w-4 h-px bg-border" />}
            </div>
          ))}
        </div>

        {/* Step 0: Details */}
        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Event details</CardTitle>
              <CardDescription>Basic information about your treasure hunt</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="eventName">Event name</Label>
                <Input
                  id="eventName"
                  placeholder="e.g., Spring Campus Hunt 2026"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eventDesc">Description</Label>
                <Textarea
                  id="eventDesc"
                  placeholder="Tell participants what to expect..."
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coverImg">Cover image URL (optional)</Label>
                <Input
                  id="coverImg"
                  placeholder="https://..."
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Checkpoints */}
        {step === 1 && (
          <div className="space-y-4">
            {checkpoints.map((cp, cpIndex) => (
              <Card key={cpIndex}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Checkpoint {cpIndex + 1}
                    </CardTitle>
                    {checkpoints.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => removeCheckpoint(cpIndex)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Name</Label>
                      <Input
                        placeholder="Library entrance"
                        value={cp.name}
                        onChange={(e) => updateCheckpoint(cpIndex, "name", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Radius (m)</Label>
                      <Input
                        type="number"
                        value={cp.radiusMeters}
                        onChange={(e) => updateCheckpoint(cpIndex, "radiusMeters", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Latitude</Label>
                      <Input
                        type="number"
                        step="any"
                        placeholder="12.9716"
                        value={cp.latitude}
                        onChange={(e) => updateCheckpoint(cpIndex, "latitude", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Longitude</Label>
                      <Input
                        type="number"
                        step="any"
                        placeholder="77.5946"
                        value={cp.longitude}
                        onChange={(e) => updateCheckpoint(cpIndex, "longitude", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Clue text</Label>
                    <Input
                      placeholder="Head to the oldest building on campus..."
                      value={cp.clueText}
                      onChange={(e) => updateCheckpoint(cpIndex, "clueText", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Help token hint (optional)</Label>
                    <Input
                      placeholder="Look for the statue near the entrance"
                      value={cp.helpTokenHint}
                      onChange={(e) => updateCheckpoint(cpIndex, "helpTokenHint", e.target.value)}
                    />
                  </div>

                  {/* Riddles */}
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Riddles</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => addRiddle(cpIndex)}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add riddle
                      </Button>
                    </div>
                    {cp.riddles.map((riddle, rIndex) => (
                      <div key={rIndex} className="border rounded-md p-3 space-y-2 bg-muted/30">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Riddle {rIndex + 1}</span>
                          {cp.riddles.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => removeRiddle(cpIndex, rIndex)}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          )}
                        </div>
                        <Input
                          placeholder="What year was this building constructed?"
                          value={riddle.question}
                          onChange={(e) => updateRiddle(cpIndex, rIndex, "question", e.target.value)}
                          className="text-sm"
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-2">
                            <Input
                              placeholder="Correct answer"
                              value={riddle.correctAnswer}
                              onChange={(e) => updateRiddle(cpIndex, rIndex, "correctAnswer", e.target.value)}
                              className="text-sm"
                            />
                          </div>
                          <Input
                            type="number"
                            placeholder="Points"
                            value={riddle.maxPoints}
                            onChange={(e) => updateRiddle(cpIndex, rIndex, "maxPoints", e.target.value)}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button variant="outline" className="w-full" onClick={addCheckpoint}>
              <Plus className="h-4 w-4 mr-1.5" /> Add checkpoint
            </Button>
          </div>
        )}

        {/* Step 2: Settings */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" /> Game settings
              </CardTitle>
              <CardDescription>Configure rules for this event</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Help tokens per team</Label>
                  <Input
                    type="number"
                    value={helpTokens}
                    onChange={(e) => setHelpTokens(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Number of hints each team can use</p>
                </div>
                <div className="space-y-2">
                  <Label>Max teams</Label>
                  <Input
                    type="number"
                    value={maxTeams}
                    onChange={(e) => setMaxTeams(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time limit (minutes)</Label>
                  <Input
                    type="number"
                    value={maxTimeMinutes}
                    onChange={(e) => setMaxTimeMinutes(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time penalty (pts/min)</Label>
                  <Input
                    type="number"
                    value={timePenalty}
                    onChange={(e) => setTimePenalty(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Points deducted per minute after time limit</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Review & create</CardTitle>
              <CardDescription>Verify everything looks correct</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium">{eventName}</h4>
                {eventDescription && <p className="text-sm text-muted-foreground">{eventDescription}</p>}
              </div>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-2">
                  {checkpoints.length} checkpoint{checkpoints.length !== 1 ? "s" : ""}
                </h4>
                {checkpoints.map((cp, i) => (
                  <div key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span>{cp.name || `Checkpoint ${i + 1}`}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {cp.riddles.length} riddle{cp.riddles.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <span>Help tokens: {helpTokens}</span>
                <span>Max teams: {maxTeams}</span>
                <span>Time limit: {maxTimeMinutes} min</span>
                <span>Penalty: {timePenalty} pts/min</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            onClick={() => step > 0 ? setStep(step - 1) : navigate("/organize")}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            {step > 0 ? "Back" : "Cancel"}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
              Next <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Creating..." : "Create event"}
            </Button>
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default CreateEvent;
