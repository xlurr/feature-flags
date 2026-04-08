import { useState } from "react";
import { ShieldCheck } from "@phosphor-icons/react";

interface LoginPageProps {
  onLogin: (email: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("admin@ff.local");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // In production this calls POST /api/auth/login (Stage 6 JWT endpoint)
      // The server sets an httpOnly cookie with the JWT token
      // For now: accept seeded credentials from 001init.sql
      if (email === "admin@ff.local" && password === "admin123") {
        // Simulate network latency
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
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
            <ShieldCheck size={18} weight="bold" className="text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">FF Manager</span>
        </div>

        <div className="bg-card border border-card-border rounded-xl shadow-lg p-8">
          <h1 className="text-xl font-semibold text-foreground text-center mb-1">Sign in</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Feature Flags Manager
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
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-primary/30 focus:border-primary/40 outline-none transition-all"
                placeholder="admin@ff.local"
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
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-primary/30 focus:border-primary/40 outline-none transition-all"
                placeholder="••••••••"
                data-testid="login-password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-2 text-sm bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
              data-testid="btn-login"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-center mt-6 text-[11px] text-muted-foreground">
            JWT · httpOnly cookie · bcrypt (Stage 6)
          </p>
        </div>
      </div>
    </div>
  );
}
