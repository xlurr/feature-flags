import { Link, useLocation } from "wouter";
import {
  ShieldCheck,
  ChartBar,
  Flag,
  ClockCounterClockwise,
  Gear,
  SignOut,
} from "@phosphor-icons/react";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";

const NAV_ITEMS = [
  { path: "/", label: "Дашборд", icon: ChartBar },
  { path: "/flags", label: "Feature Flags", icon: Flag },
  { path: "/audit", label: "Журнал аудита", icon: ClockCounterClockwise },
  { path: "/settings", label: "Настройки", icon: Gear },
] as const;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen overflow-hidden" data-testid="app-layout">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-border bg-sidebar flex flex-col">
        {/* Logo */}
        <Link href="/">
          <div
            className="h-12 flex items-center gap-2.5 px-4 border-b border-border cursor-pointer hover:bg-sidebar-accent/50 transition-colors"
            data-testid="sidebar-logo"
          >
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <ShieldCheck size={14} weight="bold" className="text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-foreground">FF Manager</span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 py-2 px-2 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.path === "/"
                ? location === "/" || location === ""
                : location.startsWith(item.path);
            const Icon = item.icon;

            return (
              <Link key={item.path} href={item.path}>
                <button
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors ${
                    isActive
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                  data-testid={`nav-${item.path.replace("/", "") || "dashboard"}`}
                >
                  <Icon size={16} weight={isActive ? "fill" : "regular"} />
                  {item.label}
                </button>
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">admin@system.local</p>
              <p className="text-[11px] text-muted-foreground">Администратор</p>
            </div>
            <button
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-logout"
            >
              <SignOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background">
        {children}
        <PerplexityAttribution />
      </main>
    </div>
  );
}
