import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

export interface EventData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  organizer_id: string;
  start_time: string | null;
  end_time: string | null;
  status: "draft" | "active" | "paused" | "completed";
  settings: {
    help_tokens_per_team?: number;
    max_teams?: number;
    max_time_minutes?: number;
    time_penalty_per_minute?: number;
  } | null;
  invite_code: string;
  created_at: string;
  updated_at: string;
}

interface EventContextType {
  currentEvent: EventData | null;
  events: EventData[];
  loading: boolean;
  setCurrentEvent: (event: EventData | null) => void;
  refreshEvents: () => Promise<void>;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const [currentEvent, setCurrentEvent] = useState<EventData | null>(null);
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshEvents = async () => {
    if (!user) {
      setEvents([]);
      setLoading(false);
      return;
    }

    try {
      if (profile?.role === "organizer") {
        // Organizers see their own events
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .eq("organizer_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setEvents((data ?? []) as EventData[]);
      } else {
        // Players see events they've joined
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .in("id", (
            await supabase
              .from("team_members")
              .select("team_id")
              .eq("user_id", user.id)
          ).data?.map(async () => {
            // Need to go through teams to get event_ids
            const { data: teams } = await supabase
              .from("team_members")
              .select("team_id, teams!inner(event_id)")
              .eq("user_id", user.id);
            return teams?.map((t: any) => t.teams.event_id) ?? [];
          }) ?? [])
          .order("created_at", { ascending: false });

        if (!error && data) {
          setEvents(data as EventData[]);
        } else {
          // Fallback: get events via team membership
          const { data: memberTeams } = await supabase
            .from("team_members")
            .select("team_id")
            .eq("user_id", user.id);

          if (memberTeams && memberTeams.length > 0) {
            const teamIds = memberTeams.map(m => m.team_id);
            const { data: teamData } = await supabase
              .from("teams")
              .select("event_id")
              .in("id", teamIds);

            const eventIds = [...new Set(teamData?.map(t => t.event_id).filter(Boolean))];
            if (eventIds.length > 0) {
              const { data: eventData } = await supabase
                .from("events")
                .select("*")
                .in("id", eventIds);
              setEvents((eventData ?? []) as EventData[]);
            } else {
              setEvents([]);
            }
          } else {
            setEvents([]);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshEvents();
  }, [user, profile]);

  // Restore last selected event from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("current_event_id");
    if (saved && events.length > 0) {
      const found = events.find(e => e.id === saved);
      if (found) setCurrentEvent(found);
    }
  }, [events]);

  const handleSetCurrentEvent = (event: EventData | null) => {
    setCurrentEvent(event);
    if (event) {
      localStorage.setItem("current_event_id", event.id);
    } else {
      localStorage.removeItem("current_event_id");
    }
  };

  const value = {
    currentEvent,
    events,
    loading,
    setCurrentEvent: handleSetCurrentEvent,
    refreshEvents,
  };

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
};

export const useEvent = () => {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error("useEvent must be used within an EventProvider");
  }
  return context;
};
