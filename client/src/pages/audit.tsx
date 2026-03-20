import { useQuery } from "@tanstack/react-query";
import type { AuditEventFull } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

const EVENT_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  CREATE: { label: "CREATE", color: "bg-emerald-500/10 text-emerald-600" },
  DELETE: { label: "DELETE", color: "bg-destructive/10 text-destructive" },
  TOGGLE: { label: "TOGGLE", color: "bg-primary/10 text-primary" },
  UPDATE_RULES: { label: "UPDATE", color: "bg-amber-500/10 text-amber-600" },
  UPDATE_ENV: { label: "UPDATE", color: "bg-blue-500/10 text-blue-600" },
};

export default function AuditPage() {
  const { data: events, isLoading } = useQuery<AuditEventFull[]>({
    queryKey: ["/api/audit"],
  });

  return (
    <div className="flex-1 overflow-auto">
      <header className="h-12 shrink-0 border-b border-border flex items-center px-6">
        <h1 className="text-sm font-semibold text-foreground">Журнал изменений</h1>
      </header>

      <div className="p-6">
        <div className="max-w-5xl mx-auto">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 rounded-md" />
              ))}
            </div>
          ) : (
            <div className="bg-card border border-card-border rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="px-4 py-2.5 font-medium">Дата и время</th>
                    <th className="px-4 py-2.5 font-medium">Пользователь</th>
                    <th className="px-4 py-2.5 font-medium">Действие</th>
                    <th className="px-4 py-2.5 font-medium">Детали</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {(events ?? []).map((event) => {
                    const typeInfo = EVENT_TYPE_LABELS[event.eventType] ?? {
                      label: event.eventType,
                      color: "bg-muted text-muted-foreground",
                    };
                    const diff = event.diffPayload ? JSON.parse(event.diffPayload) : {};

                    return (
                      <tr
                        key={event.id}
                        className="hover:bg-accent/30 transition-colors"
                        data-testid={`audit-row-${event.id}`}
                      >
                        <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap tabular-nums">
                          {new Date(event.createdAt).toLocaleString("ru-RU")}
                        </td>
                        <td className="px-4 py-2.5 text-xs font-medium text-foreground">
                          {event.actorName}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${typeInfo.color}`}
                          >
                            {typeInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">
                          {event.flagKey && (
                            <code className="text-primary bg-primary/8 px-1 py-px rounded text-[10px] font-mono mr-1.5">
                              {event.flagKey}
                            </code>
                          )}
                          {diff.action ?? event.eventType}
                          {event.envKey && (
                            <span className="ml-1 text-muted-foreground">
                              ({event.envKey})
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {(events ?? []).length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-xs text-muted-foreground">
                        Нет записей аудита
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
