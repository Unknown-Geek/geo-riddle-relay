import { useNavigate } from "react-router-dom";
import { Compass, LogOut, Moon, Sun } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";

interface AppShellProps {
  children: React.ReactNode;
  role: "player" | "organizer";
  eventName?: string;
}

export function AppShell({ children, role, eventName }: AppShellProps) {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role={role} eventName={eventName} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar — always visible */}
        <header className="flex items-center justify-between h-12 px-4 border-b border-border bg-background shrink-0 lg:hidden">
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm tracking-tight">Riddle Relay</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={async () => { await signOut(); navigate("/"); }}
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              Sign out
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="pb-20 lg:pb-0">
            {children}
          </div>
        </main>
      </div>
      <MobileNav role={role} />
    </div>
  );
}
