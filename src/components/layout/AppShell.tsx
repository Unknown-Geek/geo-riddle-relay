import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";

interface AppShellProps {
  children: React.ReactNode;
  role: "player" | "organizer";
  eventName?: string;
}

export function AppShell({ children, role, eventName }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role={role} eventName={eventName} />
      <main className="flex-1 overflow-y-auto">
        <div className="pb-20 lg:pb-0">
          {children}
        </div>
      </main>
      <MobileNav role={role} />
    </div>
  );
}
