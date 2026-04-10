export const DEFAULT_PROJECT_ID = "00000000-0000-0000-0000-000000000001";

export const ENV_COLORS: Record<string, string> = {
  production: "bg-green-500",
  staging: "bg-amber-500",
  development: "bg-blue-500",
};

export function getEnvColor(envKey: string): string {
  return ENV_COLORS[envKey] ?? "bg-muted-foreground";
}

export const EVENT_TYPE_STYLES: Record<string, { label: string; color: string }> = {
  CREATE: { label: "CREATE", color: "bg-emerald-500/10 text-emerald-600" },
  DELETE: { label: "DELETE", color: "bg-destructive/10 text-destructive" },
  TOGGLE: { label: "TOGGLE", color: "bg-primary/10 text-primary" },
  UPDATE_RULES: { label: "UPDATE", color: "bg-amber-500/10 text-amber-600" },
  UPDATE_ENV: { label: "UPDATE", color: "bg-blue-500/10 text-blue-600" },
};
