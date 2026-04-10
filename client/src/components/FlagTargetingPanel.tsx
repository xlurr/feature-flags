import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { DEFAULT_PROJECT_ID } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { X, Plus, Trash, FloppyDisk } from "@phosphor-icons/react";
import type { Environment } from "@shared/schema";
import { getEnvColor } from "@/lib/constants";

interface TargetingRule {
  type: string;
  value: string;
}

interface FlagState {
  id: number | string;
  flagId: number | string;
  environmentId: number | string;
  isEnabled: boolean;
  targetingRules: string | TargetingRule[] | null;
  rolloutWeight: number | null;
}

interface FlagWithStates {
  id: number | string;
  flagKey: string;
  name: string;
  states: Record<string, FlagState>;
}

const RULE_TYPES = [
  { value: "percentage", label: "Percentage rollout" },
  { value: "user_id", label: "User IDs" },
  { value: "user_group", label: "User group" },
  { value: "email_domain", label: "Email domain" },
  { value: "country", label: "Country" },
  { value: "custom", label: "Custom attribute" },
];

const USER_GROUPS = ["beta-testers", "premium", "internal", "enterprise", "early-adopters", "free-tier"];
const COUNTRIES = ["US", "EU", "RU", "JP", "KR", "BR", "IN", "GB", "DE", "FR", "CA", "AU"];

function parseRules(raw: string | TargetingRule[]): TargetingRule[] {
  if (Array.isArray(raw)) return raw;
  try {
    return JSON.parse(raw || "[]");
  } catch {
    return [];
  }
}

function RuleEditor({
  rule,
  onChange,
  onRemove,
}: {
  rule: TargetingRule;
  onChange: (r: TargetingRule) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-start gap-2 p-3 bg-muted/50 border border-border rounded-md">
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <select
            value={rule.type}
            onChange={(e) => onChange({ ...rule, type: e.target.value, value: "" })}
            className="px-2 py-1.5 text-sm border border-border rounded-md bg-background outline-none focus:ring-1 focus:ring-primary/30"
          >
            {RULE_TYPES.map((rt) => (
              <option key={rt.value} value={rt.value}>{rt.label}</option>
            ))}
          </select>
        </div>
        <div>
          {rule.type === "user_group" ? (
            <select
              value={rule.value}
              onChange={(e) => onChange({ ...rule, value: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border border-border rounded-md bg-background outline-none focus:ring-1 focus:ring-primary/30"
            >
              <option value="">Select group...</option>
              {USER_GROUPS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          ) : rule.type === "country" ? (
            <select
              value={rule.value}
              onChange={(e) => onChange({ ...rule, value: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border border-border rounded-md bg-background outline-none focus:ring-1 focus:ring-primary/30"
            >
              <option value="">Select country...</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          ) : rule.type === "percentage" ? (
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="100"
                value={rule.value || "0"}
                onChange={(e) => onChange({ ...rule, value: e.target.value })}
                className="flex-1 h-2 accent-primary"
              />
              <span className="text-sm font-mono font-semibold text-foreground w-10 text-right tabular-nums">
                {rule.value || 0}%
              </span>
            </div>
          ) : (
            <input
              type="text"
              value={rule.value}
              onChange={(e) => onChange({ ...rule, value: e.target.value })}
              placeholder={
                rule.type === "user_id" ? "user-1, user-2, user-3" :
                rule.type === "email_domain" ? "@company.com" :
                rule.type === "custom" ? "key:value" :
                "Value..."
              }
              className="w-full px-2 py-1.5 text-sm border border-border rounded-md bg-background outline-none focus:ring-1 focus:ring-primary/30 font-mono"
            />
          )}
        </div>
      </div>
      <button
        onClick={onRemove}
        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors mt-0.5"
        title="Remove rule"
      >
        <Trash size={14} />
      </button>
    </div>
  );
}

function EnvPanel({
  envKey,
  envName,
  envId,
  flagId,
  state,
}: {
  envKey: string;
  envName: string;
  envId: number | string;
  flagId: number | string;
  state: FlagState | undefined;
}) {
  const { toast } = useToast();
  const [isEnabled, setIsEnabled] = useState(state?.isEnabled ?? false);
  const [rolloutWeight, setRolloutWeight] = useState(state?.rolloutWeight ?? 100);
  const [rules, setRules] = useState<TargetingRule[]>(() => parseRules(state?.targetingRules ?? "[]"));
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setIsEnabled(state?.isEnabled ?? false);
    setRolloutWeight(state?.rolloutWeight ?? 100);
    setRules(parseRules(state?.targetingRules ?? "[]"));
    setDirty(false);
  }, [state]);

  const saveMut = useMutation({
    mutationFn: () =>
      apiRequest("PUT", `/api/flag-states/${flagId}/${envId}`, {
        isEnabled,
        targetingRules: JSON.stringify(rules),
        rolloutWeight,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`flags/${DEFAULT_PROJECT_ID}`] });
      toast({ title: `${envName} targeting saved` });
      setDirty(false);
    },
  });

  function markDirty() { setDirty(true); }

  function addRule() {
    setRules([...rules, { type: "percentage", value: "" }]);
    markDirty();
  }

  function updateRule(idx: number, rule: TargetingRule) {
    const next = [...rules];
    next[idx] = rule;
    setRules(next);
    markDirty();
  }

  function removeRule(idx: number) {
    setRules(rules.filter((_, i) => i !== idx));
    markDirty();
  }

  const envColor = getEnvColor(envKey);

  return (
    <div className="space-y-4">
      {/* Enable toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${envColor}`} />
          <span className="text-sm font-semibold text-foreground">{envName}</span>
        </div>
        <button
          onClick={() => { setIsEnabled(!isEnabled); markDirty(); }}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isEnabled ? "bg-primary" : "bg-muted-foreground/30"}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isEnabled ? "translate-x-6" : "translate-x-1"}`} />
        </button>
      </div>

      {/* Rollout slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Rollout %</label>
          <span className="text-sm font-mono font-semibold text-primary tabular-nums">{rolloutWeight}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={rolloutWeight}
          onChange={(e) => { setRolloutWeight(Number(e.target.value)); markDirty(); }}
          className="w-full h-2 accent-primary rounded-full"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Targeting rules */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Targeting Rules</label>
          <button
            onClick={addRule}
            className="flex items-center gap-1 px-2 py-1 text-xs text-primary hover:bg-primary/10 rounded transition-colors font-medium"
          >
            <Plus size={12} weight="bold" />
            Add Rule
          </button>
        </div>
        {rules.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">No targeting rules. All users will see the flag based on rollout %.</p>
        ) : (
          <div className="space-y-2">
            {rules.map((rule, idx) => (
              <RuleEditor
                key={idx}
                rule={rule}
                onChange={(r) => updateRule(idx, r)}
                onRemove={() => removeRule(idx)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Save button */}
      {dirty && (
        <div className="flex justify-end pt-2">
          <button
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <FloppyDisk size={14} weight="bold" />
            {saveMut.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function FlagTargetingPanel({
  flag,
  onClose,
}: {
  flag: FlagWithStates;
  onClose: () => void;
}) {
  const { data: envs } = useQuery<Environment[]>({
    queryKey: [`environments/${DEFAULT_PROJECT_ID}`],
  });
  const [activeEnv, setActiveEnv] = useState<string>("");

  useEffect(() => {
    if (envs && envs.length > 0 && !activeEnv) {
      setActiveEnv(envs[0].envKey);
    }
  }, [envs]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentEnv = envs?.find((e) => e.envKey === activeEnv);
  const currentState = flag.states[activeEnv];

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="bg-black/40 absolute inset-0" />
      <div
        className="relative bg-background border-l border-border w-full max-w-lg shadow-xl overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border px-5 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-sm font-semibold text-foreground">{flag.name}</h2>
            <code className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded mt-1 inline-block">{flag.flagKey}</code>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Environment tabs */}
        <div className="flex border-b border-border px-5 gap-0">
          {(envs ?? []).map((env) => {
            const isActive = env.envKey === activeEnv;
            const envColor = getEnvColor(env.envKey);
            return (
              <button
                key={env.envKey}
                onClick={() => setActiveEnv(env.envKey)}
                className={[
                  "flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px",
                  isActive
                    ? "text-foreground border-primary"
                    : "text-muted-foreground border-transparent hover:text-foreground",
                ].join(" ")}
              >
                <div className={`w-2 h-2 rounded-full ${envColor}`} />
                {env.name}
              </button>
            );
          })}
        </div>

        {/* Panel content */}
        <div className="p-5">
          {currentEnv && (
            <EnvPanel
              key={activeEnv}
              envKey={currentEnv.envKey}
              envName={currentEnv.name}
              envId={currentEnv.id}
              flagId={flag.id}
              state={currentState}
            />
          )}
        </div>
      </div>
    </div>
  );
}
