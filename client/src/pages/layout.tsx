import { Link, useLocation } from "wouter";
import {
  ShieldCheck, ChartBar, Flag, ClockCounterClockwise,
  Gear, SignOut, Play,
} from "@phosphor-icons/react";
import { useState, useEffect } from "react";
import { useProjectStream } from "@/hooks/useProjectStream";

import { DEFAULT_PROJECT_ID } from "@/lib/constants";
const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: ChartBar },
  { path: "/flags", label: "Feature Flags", icon: Flag },
  { path: "/audit", label: "Audit Log", icon: ClockCounterClockwise },
  { path: "/eval", label: "Eval API", icon: Play },
  { path: "/settings", label: "Settings", icon: Gear },
] as const;

const PROJECT_ID = DEFAULT_PROJECT_ID;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [dark, setDark] = useState(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  const [sseConnected, setSseConnected] = useState(false);

  useProjectStream(PROJECT_ID);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // SSE connection probe
  useEffect(() => {
    const es = new EventSource(`/api/stream/${PROJECT_ID}`);
    es.onopen = () => setSseConnected(true);
    es.onerror = () => setSseConnected(false);
    return () => es.close();
  }, []);

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
            const isActive = item.path === "/"
              ? location === "/"
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
                  data-testid={`nav-item${item.path.replace("/", "-") || "-dashboard"}`}
                >
                  <Icon size={16} weight={isActive ? "fill" : "regular"} />
                  {item.label}
                </button>
              </Link>
            );
          })}
        </nav>

        {/* SSE indicator + user row */}
        <div className="border-t border-border p-3 space-y-2">
          {/* SSE live dot */}
          <div className="flex items-center gap-1.5 px-1">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                sseConnected ? "bg-green-500 animate-pulse" : "bg-amber-400"
              }`}
            />
            <span className="text-[11px] text-muted-foreground">
              {sseConnected ? "Live" : "Connecting..."}
            </span>
          </div>

          {/* User row */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold shrink-0">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">admin@ff.local</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setDark(!dark)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
                title="Toggle theme"
              >
                {dark ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="5" />
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                  </svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </button>
              <button
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Logout"
                data-testid="button-logout"
                onClick={() => window.location.reload()}
              >
                <SignOut size={14} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background">
        {children}
      </main>
    </div>
  );
}
