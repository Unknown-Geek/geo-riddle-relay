import { useAuth } from "@/contexts/AuthContext";
import { useEvent } from "@/contexts/EventContext";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus, Calendar, Users, MapPin, Trophy, ArrowRight,
  Clock, Settings, Eye
} from "lucide-react";
import { getOrganizerEvents, getEventStats } from "@/services/organizer-service";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, Breadcrumbs } from "@/components/layout/PageHeader";

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  active: "default",
  paused: "outline",
  completed: "secondary",
};

const OrganizerDashboard = () => {
  const { user } = useAuth();
  const { setCurrentEvent } = useEvent();
  const navigate = useNavigate();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["organizer-events", user?.id],
    queryFn: () => getOrganizerEvents(user!.id),
    enabled: !!user,
  });

  return (
    <AppShell role="organizer">
      <div className="p-4 sm:p-6 space-y-6">
        <PageHeader
          title="Your events"
          description="Manage your GPS treasure hunt events"
          actions={
            <Button asChild>
              <Link to="/organize/new">
                <Plus className="h-4 w-4 mr-1.5" /> New event
              </Link>
            </Button>
          }
        />

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-1">No events yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first GPS treasure hunt event
              </p>
              <Button asChild>
                <Link to="/organize/new">
                  <Plus className="h-4 w-4 mr-1.5" /> Create event
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event: any) => (
              <Card
                key={event.id}
                className="hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => {
                  setCurrentEvent(event);
                  navigate(`/organize/${event.slug}`);
                }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{event.name}</CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        {event.description?.slice(0, 80) ?? "No description"}
                      </CardDescription>
                    </div>
                    <Badge variant={statusColors[event.status] ?? "secondary"} className="text-xs">
                      {event.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>Teams: —</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>Code: {event.invite_code}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-end">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default OrganizerDashboard;
