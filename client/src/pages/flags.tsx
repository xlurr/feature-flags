import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DEFAULT_PROJECT_ID } from "@/lib/constants";

const PROJECT_ID = DEFAULT_PROJECT_ID;
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  MagnifyingGlass, Plus, ToggleLeft, ToggleRight, Trash, X,
  Archive, ArrowCounterClockwise, DownloadSimple, Warning, Sliders,
} from "@phosphor-icons/react";
import type { FlagWithStates, Environment } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import FlagTargetingPanel from "@/components/FlagTargetingPanel";

// archivedAt отсутствует в SQLite BFF схеме, добавляем как опциональное поле.
// PostgreSQL backend добавит его в Stage 7 (migrations + domain.FeatureFlag).
type FlagWithStatesExt = FlagWithStates & { archivedAt?: string | null };

type FilterTab = "all" | "active" | "stale" | "archived";

const STALE_DAYS = 7;

function isStale(flag: FlagWithStatesExt): boolean {
  const updated = new Date(flag.updatedAt);
  const diff = (Date.now() - updated.getTime()) / (1000 * 60 * 60 * 24);
  return diff > STALE_DAYS && !flag.archivedAt;
}

function RolloutBar({ weight }: { weight: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${weight}%` }}
        />
      </div>
      <span className="text-10px text-muted-foreground tabular-nums">{weight}%</span>
    </div>
  );
}

function FilterTabBar({
  active, onChange, counts,
}: {
  active: FilterTab;
  onChange: (t: FilterTab) => void;
  counts: Record<FilterTab, number>;
}) {
  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "stale", label: "Stale" },
    { key: "archived", label: "Archived" },
  ];
  return (
    <div className="flex gap-1 bg-muted rounded-lg p-0.5 border border-border">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={[
            "flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium border-none cursor-pointer transition-all",
            active === t.key
              ? "bg-card text-foreground shadow-sm"
              : "bg-transparent text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          {t.label}
          {counts[t.key] > 0 && (
            <span
              className={[
                "text-[0.6rem] rounded-full px-1 font-semibold min-w-[1rem] h-4 flex items-center justify-center",
                active === t.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent text-primary",
              ].join(" ")}
            >
              {counts[t.key]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export default function FlagsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [activeEnv, setActiveEnv] = useState("production");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [newFlag, setNewFlag] = useState({ name: "", key: "", description: "" });
  const [selectedFlag, setSelectedFlag] = useState<FlagWithStates | null>(null);

  const { data: flags, isLoading } = useQuery<FlagWithStates[]>({
    queryKey: [`flags/${PROJECT_ID}`],
  });
  const { data: envs } = useQuery<Environment[]>({
    queryKey: [`environments/${PROJECT_ID}`],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; key: string; description: string }) => {
      const res = await apiRequest("POST", "/flags", {
        projectId: PROJECT_ID,
        flagKey: data.key,
        name: data.name,
        description: data.description,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`flags/${PROJECT_ID}`] });
      queryClient.invalidateQueries({ queryKey: [`dashboard/${PROJECT_ID}`] });
      setShowCreate(false);
      setNewFlag({ name: "", key: "", description: "" });
      toast({ title: "Flag created" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/flags/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`flags/${PROJECT_ID}`] });
      queryClient.invalidateQueries({ queryKey: [`dashboard/${PROJECT_ID}`] });
      toast({ title: "Flag deleted" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ flagId, envId }: { flagId: number; envId: number }) => {
      const res = await apiRequest("PUT", `/flags/${flagId}/toggle/${envId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`flags/${PROJECT_ID}`] });
      queryClient.invalidateQueries({ queryKey: [`dashboard/${PROJECT_ID}`] });
    },
  });

  const activeEnvObj = envs?.find((e) => e.envKey === activeEnv);

  const categorized = useMemo(() => {
    const all = (flags ?? []) as FlagWithStatesExt[];
    return {
      all: all.filter((f) => !f.archivedAt),
      active: all.filter((f) => !f.archivedAt && !isStale(f)),
      stale: all.filter((f) => isStale(f)),
      archived: all.filter((f) => !!f.archivedAt),
    } as Record<FilterTab, FlagWithStatesExt[]>;
  }, [flags]);

  const counts: Record<FilterTab, number> = {
    all: categorized.all.length,
    active: categorized.active.length,
    stale: categorized.stale.length,
    archived: categorized.archived.length,
  };

  const filtered = useMemo(() => {
    const lowerSearch = search.toLowerCase();
    return (categorized[filterTab] ?? []).filter(
      (f) =>
        f.name.toLowerCase().includes(lowerSearch) ||
        f.flagKey.toLowerCase().includes(lowerSearch)
    );
  }, [categorized, filterTab, search]);

  const staleCount = categorized.stale.length;

  function handleExportCSV() {
    const rows = [
      ["Key", "Name", "Description", "Env", "Enabled", "Rollout"],
      ...(flags ?? []).map((f) => {
        const state = f.states[activeEnv];
        return [
          f.flagKey,
          f.name,
          f.description ?? "",
          activeEnv,
          state?.isEnabled ? "true" : "false",
          String(state?.rolloutWeight ?? 100),
        ];
      }),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `flags-${activeEnv}-${Date.now()}.csv`;
    a.click();
  }

  return (
    <div className="flex-1 overflow-auto">
      {/* Sub-bar */}
      <header className="h-12 shrink-0 border-b border-border flex items-center justify-between px-6 bg-card gap-4">
        <h1 className="text-sm font-semibold text-foreground">Feature Flags</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors border border-border"
          >
            <DownloadSimple size={13} />
            CSV
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-opacity"
            data-testid="button-create-flag"
            data-tour="create-flag-btn"
          >
            <Plus size={13} />
            New Flag
          </button>
        </div>
      </header>

      <div className="p-6 max-w-[1040px] mx-auto">
        {/* Stale alert banner */}
        {staleCount > 0 && filterTab !== "archived" && (
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-md mb-5 border bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-sm">
            <Warning size={16} weight="fill" />
            <span>
              <strong>{staleCount}</strong> flag{staleCount > 1 ? "s have" : " has"} not been updated in over {STALE_DAYS} days.{" "}
              <button
                className="underline font-medium"
                onClick={() => setFilterTab("stale")}
              >
                Review stale flags
              </button>
            </span>
          </div>
        )}

        {/* Env tabs */}
        <div className="flex items-center gap-2 mb-5">
          {(envs ?? []).map((env) => (
            <button
              key={env.envKey}
              onClick={() => setActiveEnv(env.envKey)}
              className={[
                "px-3 py-1 rounded-md text-xs font-medium border transition-all",
                activeEnv === env.envKey
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:text-foreground",
              ].join(" ")}
            >
              {env.name}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <MagnifyingGlass
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              type="search"
              placeholder="Search flags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-border rounded-md bg-card focus:ring-1 focus:ring-primary/30 focus:border-primary/40 outline-none transition-all"
            />
          </div>
          <FilterTabBar active={filterTab} onChange={setFilterTab} counts={counts} />
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 rounded-md" />
            ))}
          </div>
        ) : (
          <div className="bg-card border border-card-border rounded-lg overflow-hidden" data-tour="flags-table">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">Name</th>
                  <th className="px-4 py-2.5 font-medium">Key</th>
                  <th className="px-4 py-2.5 font-medium">Rollout ({activeEnv})</th>
                  <th className="px-4 py-2.5 font-medium">Rules</th>
                  <th className="px-4 py-2.5 font-medium text-right">Toggle</th>
                  <th className="px-4 py-2.5 font-medium w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No flags match this filter.
                    </td>
                  </tr>
                ) : (
                  filtered.map((flag: FlagWithStatesExt) => {
                    const state = flag.states[activeEnv];
                    const isEnabled = state?.isEnabled ?? false;
                    const rollout = state?.rolloutWeight ?? 100;
                    const staleFlag = isStale(flag);
                    const archived = !!flag.archivedAt;

                    let rules: { type: string; value: string | number }[] = [];
                    try {
                      const parsed = JSON.parse(state?.targetingRules ?? "[]");
                      if (Array.isArray(parsed)) rules = parsed;
                    } catch {}

                    return (
                      <tr
                        key={flag.id}
                        className="hover:bg-accent/30 transition-colors group"
                        data-testid={`flag-row-${flag.id}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{flag.name}</span>
                            {staleFlag && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 text-[10px] font-semibold border border-amber-200 dark:border-amber-700">
                                STALE
                              </span>
                            )}
                            {archived && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-semibold border border-border">
                                ARCHIVED
                              </span>
                            )}
                          </div>
                          {flag.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{flag.description}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <code className="bg-muted text-primary px-1.5 py-0.5 rounded text-[11px] font-mono">
                            {flag.flagKey}
                          </code>
                        </td>
                        <td className="px-4 py-3">
                          <RolloutBar weight={rollout} />
                        </td>
                        <td className="px-4 py-3">
                          {rules.length === 0 ? (
                            <span className="text-xs text-muted-foreground">—</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {rules.map((rule, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded bg-primary/8 text-primary text-[10px] font-medium border border-primary/10"
                                >
                                  {rule.type === "percentage" ? `${rule.value}%` : rule.value}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!archived && activeEnvObj && (
                            <button
                              onClick={() =>
                                toggleMutation.mutate({
                                  flagId: flag.id,
                                  envId: activeEnvObj.id,
                                })
                              }
                              className="text-muted-foreground hover:text-foreground transition-colors"
                              data-testid={`toggle-${flag.id}-${activeEnv}`}
                            >
                              {isEnabled ? (
                                <ToggleRight size={22} weight="fill" className="text-primary" />
                              ) : (
                                <ToggleLeft size={22} />
                              )}
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setSelectedFlag(flag)}
                              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-all"
                              title="Targeting rules"
                            >
                              <Sliders size={14} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete "${flag.name}"?`)) {
                                  deleteMutation.mutate(flag.id);
                                }
                              }}
                              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                              data-testid={`delete-${flag.id}`}
                            >
                              <Trash size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}
        >
          <div
            className="bg-background border border-border rounded-lg shadow-lg w-full max-w-md p-5"
            data-testid="modal-create-flag"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold">New Feature Flag</h2>
              <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate(newFlag);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Name</label>
                <input
                  required
                  type="text"
                  value={newFlag.name}
                  onChange={(e) => setNewFlag({ ...newFlag, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-border rounded-md bg-card focus:ring-1 focus:ring-primary/30 focus:border-primary/40 outline-none transition-all"
                  placeholder="My Feature"
                  data-testid="input-flag-name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Key</label>
                <input
                  required
                  type="text"
                  value={newFlag.key}
                  onChange={(e) => setNewFlag({ ...newFlag, key: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-border rounded-md bg-card font-mono text-xs focus:ring-1 focus:ring-primary/30 focus:border-primary/40 outline-none transition-all"
                  placeholder="my-feature"
                  data-testid="input-flag-key"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Description</label>
                <textarea
                  value={newFlag.description}
                  onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-border rounded-md bg-card focus:ring-1 focus:ring-primary/30 focus:border-primary/40 outline-none transition-all resize-none"
                  placeholder="Optional description..."
                  rows={3}
                  data-testid="input-flag-description"
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  data-testid="button-submit-flag"
                >
                  {createMutation.isPending ? "Creating..." : "Create Flag"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Targeting Panel */}
      {selectedFlag && (
        <FlagTargetingPanel
          flag={selectedFlag}
          onClose={() => setSelectedFlag(null)}
        />
      )}
    </div>
  );
}
