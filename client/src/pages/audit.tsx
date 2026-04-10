import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { AuditEventFull } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { EVENT_TYPE_STYLES } from "@/lib/constants";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { useLang } from "@/lib/i18n";

const PAGE_SIZE = 20;

export default function AuditPage() {
  const { t } = useLang();
  const [page, setPage] = useState(0);

  const { data: countData } = useQuery<{ count: number }>({
    queryKey: ["audit/count"],
  });
  const totalCount = countData?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const { data: events, isLoading } = useQuery<AuditEventFull[]>({
    queryKey: ["audit", { limit: PAGE_SIZE, offset: page * PAGE_SIZE }],
    queryFn: async () => {
      const res = await fetch(`/api/audit?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load audit");
      return res.json();
    },
  });

  return (
    <div className="flex-1 overflow-auto">
      <header className="h-12 shrink-0 border-b border-border flex items-center justify-between px-6 bg-card">
        <h1 className="text-sm font-semibold text-foreground">{t.audit}</h1>
        {totalCount > 0 && (
          <span className="text-xs text-muted-foreground">
            {t.totalRecords}: {totalCount}
          </span>
        )}
      </header>

      <div className="p-6">
        <div className="max-w-5xl mx-auto" data-tour="audit-table">
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
                    <th className="px-4 py-2.5 font-medium">{t.time}</th>
                    <th className="px-4 py-2.5 font-medium">{t.actor}</th>
                    <th className="px-4 py-2.5 font-medium">{t.event}</th>
                    <th className="px-4 py-2.5 font-medium">{t.change}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {(events ?? []).map((event) => {
                    const typeInfo = EVENT_TYPE_STYLES[event.eventType] ?? {
                      label: event.eventType,
                      color: "bg-muted text-muted-foreground",
                    };
                    let diff: Record<string, string> = {};
                    try { diff = event.diffPayload ? JSON.parse(event.diffPayload) : {}; } catch { /* malformed JSON */ }

                    return (
                      <tr
                        key={event.id}
                        className="hover:bg-accent/30 transition-colors"
                      >
                        <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap tabular-nums">
                          {new Date(event.createdAt).toLocaleString("ru-RU")}
                        </td>
                        <td className="px-4 py-2.5 text-xs font-medium text-foreground">
                          {event.actorName}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold tracking-wide uppercase font-mono ${typeInfo.color}`}
                          >
                            {typeInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">
                          {event.flagKey && (
                            <code className="text-primary bg-primary/8 px-1 py-px rounded text-[11px] font-mono mr-1.5">
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
                        {t.noFlags}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded border border-border hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <CaretLeft size={12} />
                    {t.prev}
                  </button>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {t.page} {page + 1} {t.of} {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded border border-border hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {t.next}
                    <CaretRight size={12} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
