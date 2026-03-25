import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  MagnifyingGlass,
  Plus,
  ToggleLeft,
  ToggleRight,
  Trash,
  X,
} from "@phosphor-icons/react";
import type { FlagWithStates, Environment } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function FlagsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [activeEnv, setActiveEnv] = useState("production");
  const [showCreate, setShowCreate] = useState(false);
  const [newFlag, setNewFlag] = useState({ name: "", key: "", description: "" });

  const { data: flags, isLoading } = useQuery<FlagWithStates[]>({
    queryKey: ["/api/flags/00000000-0000-0000-0000-000000000001"],
  });

  const { data: envs } = useQuery<Environment[]>({
    queryKey: ["/api/environments/00000000-0000-0000-0000-000000000001"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; key: string; description: string }) => {
      const res = await apiRequest("POST", "/api/flags", {
        projectId: "00000000-0000-0000-0000-000000000001",
        flagKey: data.key,
        name: data.name,
        description: data.description,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flags/00000000-0000-0000-0000-000000000001"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/00000000-0000-0000-0000-000000000001"] });
      setShowCreate(false);
      setNewFlag({ name: "", key: "", description: "" });
      toast({ title: "Флаг создан" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/flags/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flags/00000000-0000-0000-0000-000000000001"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/00000000-0000-0000-0000-000000000001"] });
      toast({ title: "Флаг удален" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ flagId, envId }: { flagId: string; envId: string }) => {
      const res = await apiRequest("PUT", `/api/flags/${flagId}/toggle/${envId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flags/00000000-0000-0000-0000-000000000001"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/00000000-0000-0000-0000-000000000001"] });
    },
  });

  const activeEnvObj = envs?.find((e) => e.envKey === activeEnv);

  const filtered = (flags ?? []).filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.flagKey.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <header className="h-12 shrink-0 border-b border-border flex items-center justify-between px-6">
        <h1 className="text-sm font-semibold text-foreground">Управление флагами</h1>
        <div className="flex items-center gap-3">
          {/* Environment Tabs */}
          <div className="flex bg-muted/50 rounded-md p-0.5" data-testid="env-tabs">
            {(envs ?? []).map((env) => (
              <button
                key={env.id}
                onClick={() => setActiveEnv(env.envKey)}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  activeEnv === env.envKey
                    ? "bg-background text-foreground font-medium shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid={`env-tab-${env.envKey}`}
              >
                {env.name}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs font-medium hover:opacity-90 transition-opacity"
            data-testid="button-create-flag"
          >
            <Plus size={13} weight="bold" />
            Создать флаг
          </button>
        </div>
      </header>

      <div className="p-6">
        <div className="max-w-5xl mx-auto space-y-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlass
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="search"
              placeholder="Поиск по названию или ключу..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-card border border-card-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/40 transition-all"
              data-testid="input-search-flags"
            />
          </div>

          {/* Flags Table */}
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 rounded-md" />
              ))}
            </div>
          ) : (
            <div className="bg-card border border-card-border rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="px-4 py-2.5 font-medium">Флаг</th>
                    <th className="px-4 py-2.5 font-medium">Ключ</th>
                    <th className="px-4 py-2.5 font-medium">
                      Условия ({activeEnv})
                    </th>
                    <th className="px-4 py-2.5 font-medium text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filtered.map((flag) => {
                    const state = flag.states[activeEnv];
                    const isEnabled = state?.isEnabled ?? false;
                    const rules: Array<{ type: string; value: string | number }> = [];
                    try {
                      const parsed = JSON.parse(state?.targetingRules ?? "[]");
                      if (Array.isArray(parsed)) rules.push(...parsed);
                    } catch {}

                    return (
                      <tr
                        key={flag.id}
                        className="hover:bg-accent/30 transition-colors group"
                        data-testid={`flag-row-${flag.id}`}
                      >
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-foreground">{flag.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {flag.description}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <code className="bg-muted text-primary px-1.5 py-0.5 rounded text-[11px] font-mono">
                            {flag.flagKey}
                          </code>
                        </td>
                        <td className="px-4 py-3">
                          {rules.length === 0 ? (
                            <span className="text-xs text-muted-foreground">
                              Стандартные (100%)
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {rules.map((rule, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded bg-primary/8 text-primary text-[10px] font-medium border border-primary/10"
                                >
                                  {rule.type === "percentage"
                                    ? `${rule.value}% пользователей`
                                    : `Группа: ${rule.value}`}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                if (activeEnvObj) {
                                  toggleMutation.mutate({
                                    flagId: String(flag.id),
                                    envId: String(activeEnvObj.id),
                                  });
                                }
                              }}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                                isEnabled
                                  ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                              }`}
                              data-testid={`toggle-flag-${flag.id}`}
                            >
                              {isEnabled ? (
                                <ToggleRight size={15} weight="fill" />
                              ) : (
                                <ToggleLeft size={15} />
                              )}
                              {isEnabled ? "Включен" : "Выключен"}
                            </button>
                            <button
                              onClick={() => deleteMutation.mutate(String(flag.id))}
                              className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                              data-testid={`delete-flag-${flag.id}`}
                            >
                              <Trash size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-xs text-muted-foreground">
                        {search ? "Ничего не найдено" : "Нет флагов"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
        >
          <div
            className="bg-background border border-border rounded-lg shadow-lg w-full max-w-md p-5"
            data-testid="modal-create-flag"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold">Создать новый флаг</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
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
                <label className="block text-xs font-medium text-foreground mb-1">Название</label>
                <input
                  required
                  type="text"
                  value={newFlag.name}
                  onChange={(e) => setNewFlag({ ...newFlag, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-border rounded-md bg-card focus:ring-1 focus:ring-primary/30 focus:border-primary/40 outline-none transition-all"
                  placeholder="Новый дизайн профиля"
                  data-testid="input-flag-name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Ключ</label>
                <input
                  required
                  type="text"
                  value={newFlag.key}
                  onChange={(e) => setNewFlag({ ...newFlag, key: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-border rounded-md bg-card font-mono text-xs focus:ring-1 focus:ring-primary/30 focus:border-primary/40 outline-none transition-all"
                  placeholder="new-profile-design"
                  data-testid="input-flag-key"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Описание</label>
                <textarea
                  required
                  value={newFlag.description}
                  onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-border rounded-md bg-card focus:ring-1 focus:ring-primary/30 focus:border-primary/40 outline-none transition-all resize-none"
                  placeholder="Краткое описание..."
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
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  data-testid="button-submit-flag"
                >
                  {createMutation.isPending ? "Создание..." : "Создать"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
