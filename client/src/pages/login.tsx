import { useState, useEffect } from "react";
import { ShieldCheck } from "@phosphor-icons/react";

interface LoginPageProps {
  onLogin: (email: string) => void;
}

// CSS sprite background (reused from home page pattern)
const SPRITES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  left: `${(i * 37 + 11) % 97}%`,
  top: `${(i * 53 + 7) % 94}%`,
  size: i % 3 === 0 ? 4 : i % 3 === 1 ? 2 : 3,
  delay: `${((i * 1.3) % 6).toFixed(1)}s`,
  duration: `${(3 + (i * 0.7) % 4).toFixed(1)}s`,
  opacity: i % 4 === 0 ? 0.15 : 0.08,
}));

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (email === "admin@ff.local" && password === "admin123") {
        await new Promise((r) => setTimeout(r, 300));
        onLogin(email);
      } else {
        throw new Error("Invalid credentials");
      }
    } catch {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Pixel sprite background */}
      <div className="ff-sprite-bg" aria-hidden="true">
        {SPRITES.map((s) => (
          <div
            key={s.id}
            className="ff-sprite"
            style={{
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              opacity: s.opacity,
              animationDelay: s.delay,
              animationDuration: s.duration,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-3 shadow-md" style={{ boxShadow: "0 0 0 2px hsl(var(--primary) / 0.3), 0 4px 16px hsl(var(--primary) / 0.15)" }}>
            <ShieldCheck size={24} weight="bold" className="text-primary-foreground" />
          </div>
          <h1 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "1.25rem", fontWeight: 500, letterSpacing: "-0.02em", color: "hsl(var(--foreground))" }}>
            FF Manager
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Feature Flags Management System</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-card-border rounded-lg shadow-lg p-7" style={{ boxShadow: "0 2px 24px hsl(var(--primary) / 0.06), 0 0 0 1px hsl(var(--card-border))" }}>
          <h2 className="text-base font-semibold text-foreground text-center mb-1">Sign in</h2>
          <p className="text-xs text-muted-foreground text-center mb-5">
            Enter your credentials to continue
          </p>

          {error && (
            <div className="mb-4 px-3 py-2 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-primary/30 focus:border-primary/40 outline-none transition-all"
                placeholder="admin@ff.local"
                autoComplete="email"
                data-testid="login-email"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-primary/30 focus:border-primary/40 outline-none transition-all"
                placeholder="password"
                autoComplete="current-password"
                data-testid="login-password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-2.5 text-sm bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              data-testid="btn-login"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-border">
            <p className="text-center text-[11px] text-muted-foreground">
              Demo credentials: <code className="font-mono bg-muted px-1 py-0.5 rounded text-[10px]">admin@ff.local</code> / <code className="font-mono bg-muted px-1 py-0.5 rounded text-[10px]">admin123</code>
            </p>
          </div>
        </div>

        <p className="text-center mt-4 text-[10px] text-muted-foreground font-mono tracking-wide">
          v1.0.0 // Go 1.24 + React 18 + PostgreSQL 16
        </p>
      </div>
    </div>
  );
}
