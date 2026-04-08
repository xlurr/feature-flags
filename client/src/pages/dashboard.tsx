import { useQuery } from "@tanstack/react-query";
import { Flag, Lightning, ClockCounterClockwise, Warning, CopySimple } from "@phosphor-icons/react";
import type { DashboardStats } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const PROJECT_ID = 1;
const EVAL_URL = `${window.location.origin}/eval/`;

function StatCard({
  icon: Icon, label, value, color, testId,
}: {
  icon: typeof Flag; label: string; value: number; color: string; testId: string;
}) {
  return (
    <div className="bg-card border border-card-border rounded-lg p-4 flex items-start gap-3" data-testid={testId}>
      <div className={`p-2 rounded-md ${color}`}>
        <Icon size={18} weight="duotone" />
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold text-foreground mt-0.5 tabular-nums">{value}</p>
      </div>
    </div>
  );
}

function EnvProgressBar({ name, active, total }: { name: string; active: number; total: number }) {
  const pct = total > 0 ? (active / total) * 100 : 0;
  return (
    <div data-testid={`env-stat-${name.toLowerCase()}`}>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="font-medium text-foreground">{name}</span>
        <span className="text-muted-foreground tabular-nums">{active}/{total}</span>
      </div>
      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function EvalHintCard() {
  const { toast } = useToast();
  const exampleKey = "prod-key-001";
  const cmd = `curl ${window.location.origin}/eval/${exampleKey}`;

  function copy() {
    navigator.clipboard.writeText(cmd);
    toast({ title: "Copied to clipboard" });
  }

  return (
    <div className="bg-card border border-card-border rounded-lg overflow-hidden">
      <div className="px-5 py-3 border-b border-border/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightning size={14} weight="fill" className="text-primary" />
          <span className="text-xs font-semibold text-foreground">Eval API</span>
        </div>
        <span className="text-[10px] text-muted-foreground font-mono">GET /eval/:apiKey</span>
      </div>
      <div className="px-5 py-4">
        <p className="text-xs text-muted-foreground mb-3">
          Evaluate all flags for an environment in a single request.
        </p>
        <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-2">
          <code className="text-[11px] font-mono text-foreground flex-1 truncate">{cmd}</code>
          <button
            onClick={copy}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            title="Copy"
          >
            <CopySimple size={13} />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          Returns <code className="bg-muted px-1 rounded font-mono">{'{ "flag-key": true | false }'}</code>
        </p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: [`/api/dashboard/${PROJECT_ID}`],
  });

  const staleCount = (data?.recentAudit ?? []).filter((a: any) => {
    const diff = (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    return diff > 7;
  }).length;

  return (
    <div className="flex-1 overflow-auto">
      <header className="h-11 shrink-0 border-b border-border flex items-center px-6 bg-card">
        <h1 className="text-sm font-semibold text-foreground">Dashboard</h1>
      </header>

      <div className="p-6 max-w-[1040px] mx-auto">
        {/* Stale banner */}
        {!isLoading && staleCount > 0 && (
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-md mb-5 border bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-sm">
            <Warning size={16} weight="fill" />
            <span>
              <strong>{staleCount}</strong> flag{staleCount > 1 ? "s are" : " is"} stale.{" "}
              <a href="#/flags" className="underline font-medium">Review &rarr;</a>
            </span>
          </div>
        )}

        {/* Stat cards */}
        {isLoading ? (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <StatCard
              icon={Flag}
              label="Total Flags"
              value={data?.totalFlags ?? 0}
              color="bg-primary/10 text-primary"
              testId="stat-total-flags"
            />
            <StatCard
              icon={Lightning}
              label="Active in Prod"
              value={data?.activeInProduction ?? 0}
              color="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400"
              testId="stat-active-prod"
            />
            <StatCard
              icon={ClockCounterClockwise}
              label="Audit Events (24h)"
              value={data?.recentAudit?.length ?? 0}
              color="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400"
              testId="stat-audit-events"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Env progress */}
          <div className="bg-card border border-card-border rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-border/60">
              <span className="text-xs font-semibold text-foreground">Flags by Environment</span>
            </div>
            <div className="px-5 py-4 space-y-4">
              {isLoading ? (
                [1, 2, 3].map((i) => <Skeleton key={i} className="h-6 rounded" />)
              ) : (
                (data?.envStats ?? []).map((env: any) => (
                  <EnvProgressBar
                    key={env.envKey}
                    name={env.name}
                    active={env.activeCount}
                    total={env.totalCount}
                  />
                ))
              )}
            </div>
          </div>

          {/* Eval hint */}
          <EvalHintCard />
        </div>

        {/* Recent activity */}
        <div className="bg-card border border-card-border rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-border/60">
            <span className="text-xs font-semibold text-foreground">Recent Activity</span>
          </div>
          {isLoading ? (
            <div className="p-5 space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 rounded" />)}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">Event</th>
                  <th className="px-4 py-2.5 font-medium">Flag</th>
                  <th className="px-4 py-2.5 font-medium">Actor</th>
                  <th className="px-4 py-2.5 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {(data?.recentAudit ?? []).slice(0, 8).map((event: any) => (
                  <tr key={event.id} className="hover:bg-accent/20 transition-colors">
                    <td className="px-4 py-2.5">
                      <span
                        className={[
                          "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase font-mono",
                          event.eventType === "TOGGLE"
                            ? "bg-primary/10 text-primary"
                            : event.eventType === "CREATE"
                            ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400"
                            : event.eventType === "DELETE"
                            ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400"
                            : "bg-muted text-muted-foreground",
                        ].join(" ")}
                      >
                        {event.eventType}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <code className="text-xs font-mono text-primary">{event.flagKey ?? "—"}</code>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{event.actorName ?? "System"}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground tabular-nums">
                      {new Date(event.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
