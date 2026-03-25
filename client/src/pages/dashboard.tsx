import { useQuery } from "@tanstack/react-query";
import { Flag, Lightning, ClockCounterClockwise } from "@phosphor-icons/react";
import type { DashboardStats } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  testId,
}: {
  icon: typeof Flag;
  label: string;
  value: number;
  color: string;
  testId: string;
}) {
  return (
    <div
      className="bg-card border border-card-border rounded-lg p-4 flex items-start gap-3"
      data-testid={testId}
    >
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
        <span className="text-muted-foreground tabular-nums">
          {active} / {total} активны
        </span>
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

export default function DashboardPage() {
  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/00000000-0000-0000-0000-000000000001"],
  });

  if (isLoading || !data) {
    return (
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-8 w-32" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-48 rounded-lg" />
            <Skeleton className="h-48 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <header className="h-12 shrink-0 border-b border-border flex items-center px-6">
        <h1 className="text-sm font-semibold text-foreground">Обзор</h1>
      </header>

      <div className="p-6">
        <div className="max-w-5xl mx-auto space-y-5">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard
              icon={Flag}
              label="Всего флагов"
              value={data.totalFlags}
              color="bg-primary/10 text-primary"
              testId="stat-total-flags"
            />
            <StatCard
              icon={Lightning}
              label="Активно в Production"
              value={data.activeInProduction}
              color="bg-emerald-500/10 text-emerald-600"
              testId="stat-active-production"
            />
            <StatCard
              icon={ClockCounterClockwise}
              label="Событий аудита"
              value={data.auditEventsCount}
              color="bg-blue-500/10 text-blue-600"
              testId="stat-audit-events"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Environment Stats */}
            <div className="bg-card border border-card-border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-foreground mb-4">
                Статус по окружениям
              </h3>
              <div className="space-y-4">
                {data.envStats.map((env) => (
                  <EnvProgressBar key={env.name} {...env} />
                ))}
              </div>
            </div>

            {/* Recent Audit */}
            <div className="bg-card border border-card-border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-foreground mb-4">
                Последние действия
              </h3>
              <div className="space-y-3">
                {data.recentAudit.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Нет действий</p>
                ) : (
                  data.recentAudit.map((event) => {
                    const diff = event.diffPayload ? JSON.parse(event.diffPayload) : {};
                    return (
                      <div
                        key={event.id}
                        className="flex gap-2.5 items-start"
                        data-testid={`audit-event-${event.id}`}
                      >
                        <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-foreground">
                            <span className="font-medium">{event.actorName}</span>{" "}
                            {diff.action?.toLowerCase() ?? event.eventType.toLowerCase()}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {new Date(event.createdAt).toLocaleString("ru-RU")}
                            {event.flagKey && (
                              <>
                                {" · "}
                                <code className="text-primary bg-primary/8 px-1 py-px rounded text-[10px] font-mono">
                                  {event.flagKey}
                                </code>
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
