import { Link, useLocation } from "wouter";
import {
  ShieldCheck,
  ChartBar,
  Flag,
  ClockCounterClockwise,
  Gear,
  SignOut,
  Play,
} from "@phosphor-icons/react";
import { useState, useEffect } from "react";
import { useProjectStream } from "@/hooks/useProjectStream";
import { useLang } from "@/lib/i18n";
import { LangToggle } from "@/components/LangToggle";
import { DEFAULT_PROJECT_ID } from "@/lib/constants";

const PROJECT_ID = DEFAULT_PROJECT_ID;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const [dark, setDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  const [sseConnected, setSseConnected] = useState(false);
  const { t } = useLang();

  useProjectStream(PROJECT_ID);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    const es = new EventSource(`/api/stream/${PROJECT_ID}`);
    es.onopen = () => setSseConnected(true);
    es.onerror = () => setSseConnected(false);
    return () => es.close();
  }, []);

  const NAVITEMS = [
  { path: "/dashboard", label: t.dashboard, icon: ChartBar },
  { path: "/flags",     label: t.flags,     icon: Flag },
  { path: "/audit",     label: t.audit,     icon: ClockCounterClockwise },
  { path: "/eval",      label: t.eval,      icon: Play },
  { path: "/settings",  label: t.settings,  icon: Gear },
  ];

  return (
    <div className="flex flex-col h-screen bg-background">
      <nav className="ff-topnav">
        <Link href="/">
          <div className="ff-topnav-logo" onClick={() => navigate("/")} role="button" style={{ cursor: "pointer" }}>
            <div className="ff-topnav-logo-mark">
              <ShieldCheck size={14} weight="bold" className="text-primary-foreground" />
            </div>
            <span className="ff-topnav-logo-text">FF Manager</span>
          </div>
        </Link>

        <div className="ff-topnav-links">
          {NAVITEMS.map(({ path, label, icon: Icon }) => {
            const isActive = path === "/" ? location === "/" : location.startsWith(path);
            return (
              <Link key={path} href={path}>
                <button
                  className={`ff-nav-item${isActive ? " active" : ""}`}
                  data-testid={`nav-item${path.replace("/", "-") || "-dashboard"}`}
                >
                  <Icon size={14} weight={isActive ? "fill" : "regular"} />
                  {label}
                </button>
              </Link>
            );
          })}
        </div>

        <div className="ff-topnav-right">
          <div className="flex items-center gap-1.5">
            <div className={`ff-sse-dot${sseConnected ? "" : " ff-sse-dot--off"}`} />
            <span className="ff-sse-label" style={sseConnected ? {} : { color: "#f59e0b" }}>
              {sseConnected ? t.live : t.connecting}
            </span>
          </div>

          <LangToggle />

          <button
            className="ff-theme-toggle"
            onClick={() => setDark(!dark)}
            title={t.theme}
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

          <div className="ff-topnav-user">
            <div className="ff-topnav-user-avatar">A</div>
            <div className="hidden sm:block">
              <div className="ff-topnav-user-name">admin</div>
              <div className="ff-topnav-user-email">admin@ff.local</div>
            </div>
            <button
              className="ff-icon-btn"
              title={t.logout}
              data-testid="button-logout"
              onClick={() => window.location.reload()}
            >
              <SignOut size={14} />
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 overflow-auto bg-background">
        {children}
      </main>
    </div>
  );
}
