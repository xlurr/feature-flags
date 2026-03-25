import { useQuery } from "@tanstack/react-query";
import type { Environment, User } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Key, Users, Globe } from "@phosphor-icons/react";

export default function SettingsPage() {
  const { data: envs, isLoading: envsLoading } = useQuery<Environment[]>({
    queryKey: ["/api/environments/00000000-0000-0000-0000-000000000001"],
  });

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  return (
    <div className="flex-1 overflow-auto">
      <header className="h-12 shrink-0 border-b border-border flex items-center px-6">
        <h1 className="text-sm font-semibold text-foreground">Настройки</h1>
      </header>

      <div className="p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* API Keys */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Key size={15} weight="duotone" className="text-primary" />
              <h2 className="text-sm font-semibold text-foreground">API-ключи окружений</h2>
            </div>
            {envsLoading ? (
              <Skeleton className="h-24 rounded-md" />
            ) : (
              <div className="bg-card border border-card-border rounded-lg divide-y divide-border/50">
                {(envs ?? []).map((env) => (
                  <div
                    key={env.id}
                    className="flex items-center justify-between px-4 py-3"
                    data-testid={`api-key-${env.envKey}`}
                  >
                    <div>
                      <p className="text-xs font-medium text-foreground">{env.name}</p>
                      <p className="text-[11px] text-muted-foreground">{env.envKey}</p>
                    </div>
                    <code className="text-[11px] font-mono bg-muted px-2 py-1 rounded text-muted-foreground select-all">
                      {env.clientApiKey}
                    </code>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Eval endpoint hint */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Globe size={15} weight="duotone" className="text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Eval API</h2>
            </div>
            <div className="bg-card border border-card-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-2">
                Для получения состояния флагов из клиентского сервиса используйте:
              </p>
              <code className="text-[11px] font-mono bg-muted px-2 py-1 rounded text-foreground block">
                GET /api/eval/&#123;client_api_key&#125;
              </code>
              <p className="text-[11px] text-muted-foreground mt-2">
                Ответ: JSON-объект &#123; "flag-key": true/false, ... &#125;
              </p>
            </div>
          </section>

          {/* Users */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Users size={15} weight="duotone" className="text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Пользователи</h2>
            </div>
            {usersLoading ? (
              <Skeleton className="h-24 rounded-md" />
            ) : (
              <div className="bg-card border border-card-border rounded-lg divide-y divide-border/50">
                {(users ?? []).map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between px-4 py-3"
                    data-testid={`user-row-${user.id}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-semibold">
                        {user.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-foreground">{user.fullName}</p>
                        <p className="text-[11px] text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        user.role === "admin"
                          ? "bg-primary/10 text-primary"
                          : user.role === "manager"
                            ? "bg-amber-500/10 text-amber-600"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {user.role === "admin"
                        ? "Администратор"
                        : user.role === "manager"
                          ? "Менеджер"
                          : "Разработчик"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
