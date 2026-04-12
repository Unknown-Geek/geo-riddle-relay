import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Map, Trophy, Users, LayoutDashboard } from "lucide-react";

interface MobileNavProps {
  role: "player" | "organizer";
}

const playerLinks = [
  { label: "Play", href: "/dashboard", icon: Map },
  { label: "Board", href: "/leaderboard", icon: Trophy },
  { label: "Team", href: "/dashboard", icon: Users },
];

const organizerLinks = [
  { label: "Events", href: "/organize", icon: LayoutDashboard },
];

export function MobileNav({ role }: MobileNavProps) {
  const location = useLocation();
  const links = role === "organizer" ? organizerLinks : playerLinks;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background lg:hidden">
      <div className="flex items-center justify-around h-14">
        {links.map((link) => {
          const active = location.pathname === link.href;
          return (
            <Link
              key={link.label}
              to={link.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 w-full h-full text-xs transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <link.icon className="h-5 w-5" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
