import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Map, Trophy, Users, Settings, Compass, LayoutDashboard } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const playerNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Map", href: "/dashboard", icon: Map },
  { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { label: "Team", href: "/dashboard", icon: Users },
];

const organizerNav: NavItem[] = [
  { label: "Events", href: "/organize", icon: LayoutDashboard },
  { label: "Settings", href: "/organize/settings", icon: Settings },
];

interface SidebarProps {
  role: "player" | "organizer";
  eventName?: string;
}

export function Sidebar({ role, eventName }: SidebarProps) {
  const location = useLocation();
  const items = role === "organizer" ? organizerNav : playerNav;

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-56 lg:border-r lg:border-border lg:bg-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-14 border-b border-border">
        <Compass className="h-5 w-5 text-primary" />
        <span className="font-semibold text-sm tracking-tight">Riddle Relay</span>
      </div>

      {/* Event badge */}
      {eventName && (
        <div className="px-4 py-3 border-b border-border">
          <p className="text-xs text-muted-foreground">Current Event</p>
          <p className="text-sm font-medium truncate">{eventName}</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-1">
        {items.map((item) => {
          const active = location.pathname === item.href;
          return (
            <Link
              key={item.label}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
                active
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border flex items-center justify-between">
        <ThemeToggle />
      </div>
    </aside>
  );
}
