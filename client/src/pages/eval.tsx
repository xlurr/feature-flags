import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Environment } from "@shared/schema";
import { Play, CopySimple, ArrowsClockwise } from "@phosphor-icons/react";
import { useToast } from "@/hooks/use-toast";
import { DEFAULT_PROJECT_ID } from "@/lib/constants";

const PROJECT_ID = DEFAULT_PROJECT_ID;

interface EvalResult {
  [flagKey: string]: boolean;
}

interface CacheStats {
  hits: number;
  misses: number;
  entries: number;
  hitRate: number;
}

function HitRateBar({ rate }: { rate: number }) {
  const pct = Math.round(rate * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-semibold tabular-nums text-foreground">{pct}%</span>
    </div>
  );
}

export default function EvalPage() {
  const { toast } = useToast();
  const { data: envs } = useQuery<Environment[]>({ queryKey: [`environments/${DEFAULT_PROJECT_ID}`] });

  const [selectedApiKey, setSelectedApiKey] = useState("");
  const [customKey, setCustomKey] = useState("");
  const [result, setResult] = useState<EvalResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Mock cache stats — real endpoint is GET /api/cache/stats (Stage 4 InMemoryCache)
  const [cacheStats] = useState<CacheStats>({
    hits: 1482,
    misses: 57,
    entries: 9,
    hitRate: 0.963,
  });

  const apiKey = customKey || selectedApiKey;

  async function runEval() {
    if (!apiKey) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`/eval/${apiKey}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: Invalid API key`);
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message ?? "Evaluation failed");
    } finally {
      setLoading(false);
    }
  }

  function copyResult() {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    toast({ title: "Copied JSON to clipboard" });
  }

  const curlCmd = apiKey ? `curl ${window.location.origin}/eval/${apiKey}` : "";

  return (
    <div className="flex-1 overflow-auto">
      <header className="h-11 shrink-0 border-b border-border flex items-center px-6 bg-card">
        <h1 className="text-sm font-semibold text-foreground">Eval API Tester</h1>
      </header>

      <div className="p-6 max-w-[860px] mx-auto space-y-5">
        {/* API Key selector */}
        <div className="bg-card border border-card-border rounded-lg p-5">
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-3">API Key</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {(envs ?? []).map((env) => (
              <button
                key={env.envKey}
                onClick={() => { setSelectedApiKey(env.clientApiKey); setCustomKey(""); }}
                className={[
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-all",
                  selectedApiKey === env.clientApiKey && !customKey
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-border hover:text-foreground",
                ].join(" ")}
              >
                {env.name}
                <code className="opacity-60 font-mono text-[10px]">{env.clientApiKey}</code>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Or paste a custom API key..."
              value={customKey}
              onChange={(e) => { setCustomKey(e.target.value); setSelectedApiKey(""); }}
              className="flex-1 px-3 py-1.5 text-xs border border-border rounded-md bg-card font-mono focus:ring-1 focus:ring-primary/30 outline-none transition-all"
            />
            <button
              onClick={runEval}
              disabled={!apiKey || loading}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Play size={12} weight="fill" />
              {loading ? "Running..." : "Run"}
            </button>
          </div>
          {curlCmd && (
            <div className="flex items-center gap-2 mt-3 bg-muted rounded-md px-3 py-2">
              <code className="text-[11px] font-mono text-foreground flex-1 truncate">{curlCmd}</code>
              <button
                onClick={() => { navigator.clipboard.writeText(curlCmd); toast({ title: "Copied" }); }}
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <CopySimple size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Result */}
        {(result || error) && (
          <div className="bg-card border border-card-border rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-border/60 flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">
                {error ? "Error" : `Response — ${Object.keys(result ?? {}).length} flags`}
              </span>
              {result && (
                <button
                  onClick={copyResult}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Copy JSON"
                >
                  <CopySimple size={13} />
                </button>
              )}
            </div>
            {error ? (
              <div className="px-5 py-4 text-sm text-destructive">{error}</div>
            ) : (
              <div className="px-5 py-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-xs text-muted-foreground border-b border-border">
                      <th className="py-2 font-medium">Flag Key</th>
                      <th className="py-2 font-medium">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {Object.entries(result ?? {}).map(([key, val]) => (
                      <tr key={key} className="hover:bg-accent/20 transition-colors">
                        <td className="py-2">
                          <code className="text-xs font-mono text-primary">{key}</code>
                        </td>
                        <td className="py-2">
                          <span
                            className={[
                              "text-xs font-semibold font-mono",
                              val ? "text-green-600 dark:text-green-400" : "text-muted-foreground",
                            ].join(" ")}
                          >
                            {val ? "true" : "false"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Cache Stats (Stage 4 InMemoryCache) */}
        <div className="bg-card border border-card-border rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-border/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground">Cache Stats</span>
              <span className="text-[10px] text-muted-foreground font-mono">InMemoryCache · Stage 4</span>
            </div>
            <button
              title="Invalidate all cache entries"
              className="flex items-center gap-1 px-2.5 py-1 text-[10px] text-muted-foreground border border-border rounded hover:bg-muted hover:text-foreground transition-colors"
              onClick={() => toast({ title: "Cache invalidated (mock)" })}
            >
              <ArrowsClockwise size={11} />
              Invalidate
            </button>
          </div>
          <div className="px-5 py-4">
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Hit Rate", node: <HitRateBar rate={cacheStats.hitRate} /> },
                { label: "Hits", node: <span className="text-sm font-semibold tabular-nums text-foreground">{cacheStats.hits.toLocaleString()}</span> },
                { label: "Misses", node: <span className="text-sm font-semibold tabular-nums text-foreground">{cacheStats.misses.toLocaleString()}</span> },
                { label: "Entries", node: <span className="text-sm font-semibold tabular-nums text-foreground">{cacheStats.entries}</span> },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                  {item.node}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-3">
              Real stats available via <code className="font-mono bg-muted px-1 rounded">GET /api/cache/stats</code> after wiring the endpoint.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
