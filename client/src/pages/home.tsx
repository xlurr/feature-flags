import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { useTheme } from "next-themes";

// ─── Mock data ────────────────────────────────────────────────────────────────



// ─── CSS Sprite Background ────────────────────────────────────────────────────

const SPRITES = Array.from({ length: 32 }, (_, i) => ({
  id:       i,
  left:     `${(i * 37 + 11) % 97}%`,
  top:      `${(i * 53 + 7)  % 94}%`,
  size:     i % 3 === 0 ? 4 : i % 3 === 1 ? 2 : 3,
  delay:    `${((i * 1.3) % 6).toFixed(1)}s`,
  duration: `${(3 + (i * 0.7) % 4).toFixed(1)}s`,
  opacity:  i % 4 === 0 ? 0.18 : 0.10,
}));

function CssSpriteBackground() {
  return (
    <div className="ff-sprite-bg" aria-hidden="true">
      {SPRITES.map(s => (
        <div
          key={s.id}
          className="ff-sprite"
          style={{
            left:              s.left,
            top:               s.top,
            width:             s.size,
            height:            s.size,
            opacity:           s.opacity,
            animationDelay:    s.delay,
            animationDuration: s.duration,
          }}
        />
      ))}
    </div>
  );
}

const MOCK_FLAGS = [
  { key: "stripe-checkout-v2", name: "Stripe Checkout v2", enabled: true,  rollout: 10,  evals: 12480, uplift: "+18.3%", upliftDir: "up"      as const, rule: "percentage:10"  },
  { key: "zendesk-feature",    name: "Zendesk AI Bot",     enabled: true,  rollout: 100, evals: 8941,  uplift: "+7.1%",  upliftDir: "up"      as const, rule: "userGroup:beta" },
  { key: "datadogs-rum",       name: "Datadog RUM",        enabled: false, rollout: 5,   evals: 3210,  uplift: "—",      upliftDir: "neutral" as const, rule: "percentage:5"   },
] as const;

const EVAL_DATA = [420, 480, 510, 530, 490, 520, 560, 540, 580, 620, 780, 820, 850, 890];
const CONV_DATA = [42,  48,  50,  52,  49,  51,  55,  53,  57,  61,  88,  96, 100, 112];

// ─── (Float config removed — slices layout) ─────────────────────────────────

// ─── Pixel Lizard (gecko, 18×22, 4px) ────────────────────────────────────────

const PX   = 4;
const COLS = 18;
const ROWS = 22;

type Pixel = [col: number, row: number, color: string];

const PIXEL_MAP: Pixel[] = [
  // хвост
  [10,21,"#4c1d95"],[11,21,"#5b21b6"],
  [9,20,"#5b21b6"],[10,20,"#6d28d9"],
  [8,19,"#6d28d9"],[9,19,"#7c3aed"],
  [7,18,"#6d28d9"],[8,18,"#7c3aed"],[9,18,"#6d28d9"],
  [7,17,"#7c3aed"],[8,17,"#a78bfa"],[9,17,"#7c3aed"],
  // тело-зад
  [6,16,"#6d28d9"],[7,16,"#7c3aed"],[8,16,"#a78bfa"],[9,16,"#7c3aed"],[10,16,"#6d28d9"],
  // задние лапки
  [3,15,"#7c3aed"],[4,15,"#6d28d9"],
  [11,15,"#6d28d9"],[12,15,"#7c3aed"],
  [2,14,"#6d28d9"],[3,14,"#7c3aed"],
  [12,14,"#7c3aed"],[13,14,"#6d28d9"],
  [1,13,"#5b21b6"],[2,13,"#6d28d9"],
  [13,13,"#6d28d9"],[14,13,"#5b21b6"],
  // средняя часть тела
  [4,15,"#6d28d9"],[5,15,"#7c3aed"],[6,15,"#a78bfa"],[7,15,"#c4b5fd"],[8,15,"#c4b5fd"],[9,15,"#a78bfa"],[10,15,"#7c3aed"],[11,15,"#6d28d9"],
  [4,14,"#6d28d9"],[5,14,"#7c3aed"],[6,14,"#a78bfa"],[7,14,"#c4b5fd"],[8,14,"#c4b5fd"],[9,14,"#a78bfa"],[10,14,"#7c3aed"],[11,14,"#6d28d9"],
  [5,13,"#7c3aed"],[6,13,"#a78bfa"],[7,13,"#c4b5fd"],[8,13,"#c4b5fd"],[9,13,"#a78bfa"],[10,13,"#7c3aed"],
  // передние лапки
  [3,12,"#7c3aed"],[4,12,"#6d28d9"],
  [11,12,"#6d28d9"],[12,12,"#7c3aed"],
  [2,11,"#6d28d9"],[3,11,"#7c3aed"],
  [12,11,"#7c3aed"],[13,11,"#6d28d9"],
  [1,10,"#5b21b6"],[2,10,"#6d28d9"],
  [13,10,"#6d28d9"],[14,10,"#5b21b6"],
  // тело-перед
  [4,12,"#6d28d9"],[5,12,"#7c3aed"],[6,12,"#a78bfa"],[7,12,"#c4b5fd"],[8,12,"#c4b5fd"],[9,12,"#a78bfa"],[10,12,"#7c3aed"],[11,12,"#6d28d9"],
  [5,11,"#7c3aed"],[6,11,"#a78bfa"],[7,11,"#c4b5fd"],[8,11,"#c4b5fd"],[9,11,"#a78bfa"],[10,11,"#7c3aed"],
  [5,10,"#7c3aed"],[6,10,"#a78bfa"],[7,10,"#a78bfa"],[8,10,"#a78bfa"],[9,10,"#a78bfa"],[10,10,"#7c3aed"],
  // шея
  [6,9,"#7c3aed"],[7,9,"#a78bfa"],[8,9,"#a78bfa"],[9,9,"#7c3aed"],
  [6,8,"#6d28d9"],[7,8,"#7c3aed"],[8,8,"#7c3aed"],[9,8,"#6d28d9"],
  // голова
  [5,7,"#6d28d9"],[6,7,"#7c3aed"],[7,7,"#a78bfa"],[8,7,"#a78bfa"],[9,7,"#7c3aed"],[10,7,"#6d28d9"],
  // глаза
  [5,6,"#7c3aed"],[6,6,"#c4b5fd"],[7,6,"#1e1b4b"],[8,6,"#c4b5fd"],[9,6,"#1e1b4b"],[10,6,"#7c3aed"],
  [5,5,"#7c3aed"],[6,5,"#a78bfa"],[7,5,"#a78bfa"],[8,5,"#a78bfa"],[9,5,"#a78bfa"],[10,5,"#7c3aed"],
  // морда
  [6,4,"#6d28d9"],[7,4,"#7c3aed"],[8,4,"#7c3aed"],[9,4,"#6d28d9"],
  [6,3,"#6d28d9"],[7,3,"#6d28d9"],[8,3,"#6d28d9"],[9,3,"#6d28d9"],
  // язык
  [7,2,"#e879f9"],[8,2,"#e879f9"],
  [7,1,"#d946ef"],[9,1,"#d946ef"],
];

function PixelLizard() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "relative",
        width: COLS * PX,
        height: ROWS * PX,
        flexShrink: 0,
        imageRendering: "pixelated",
      }}
    >
      {PIXEL_MAP.map(([col, row, color], i) => (
        <div key={i} style={{
          position: "absolute",
          left: col * PX,
          top:  row * PX,
          width: PX,
          height: PX,
          background: color,
        }} />
      ))}
    </div>
  );
}

// ─── FlagMiniList (с автотоглом) ──────────────────────────────────────────────

const MINI_FLAGS = [
  { key: "stripe-checkout", on: true  },
  { key: "zen-desk-feature", on: true  },
  { key: "datadogs-rum",     on: false },
];

function FlagMiniList() {
  const [states, setStates] = useState(MINI_FLAGS.map((f) => f.on));
  useEffect(() => {
    let idx = 0;
    const id = setInterval(() => {
      idx = (idx + 1) % MINI_FLAGS.length;
      setStates((prev) => prev.map((v, i) => (i === idx ? !v : v)));
    }, 2200);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="ff-flag-mini-list">
      {MINI_FLAGS.map((f, i) => (
        <div className="ff-flag-key-row" key={f.key}>
          <span className="ff-flag-key-name">{f.key}</span>
          <div className={`ff-flag-toggle ${states[i] ? "on" : "off"}`} />
        </div>
      ))}
    </div>
  );
}

// ─── Slice (static, no float) ────────────────────────────────────────────────

function Slice({ children }: { children: React.ReactNode }) {
  return <div className="ff-logo-slice">{children}</div>;
}

// ─── LogoStage (4 карточки) ───────────────────────────────────────────────────

function LogoStage() {
  return (
    <div className="ff-logo-stage">
      <div className="ff-logo-slices">

        {/* 0 — ящерица */}
        <Slice>
          <PixelLizard />
          <span className="ff-logo-label">FF Manager</span>
          <span className="ff-logo-sub">FEATURE FLAGS</span>
          <FlagMiniList />
        </Slice>

        {/* 1 — environments */}
        <Slice>
          <span className="ff-logo-sub" style={{ marginBottom: ".25rem" }}>ENVIRONMENTS</span>
          <div style={{ display: "flex", flexDirection: "column", gap: ".375rem", width: "100%" }}>
            {[
              { key: "production",  color: "var(--green-700)", bg: "hsl(142 76% 36% / 0.15)" },
              { key: "staging",     color: "var(--amber-700)", bg: "hsl(45 93% 47% / 0.12)"  },
              { key: "development", color: "var(--blue-700)",  bg: "hsl(217 91% 60% / 0.12)" },
            ].map(e => (
              <div key={e.key} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: ".3rem .5rem", borderRadius: "var(--radius-sm)",
                border: "1px solid hsl(var(--border))", background: e.bg,
              }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: ".5rem", color: e.color, fontWeight: 700 }}>{e.key}</span>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: e.color, display: "inline-block" }} />
              </div>
            ))}
          </div>
        </Slice>

        {/* 2 — eval stats */}
        <Slice>
          <span className="ff-logo-sub" style={{ marginBottom: ".25rem" }}>EVAL API · &lt;1ms</span>
          <div style={{ display: "flex", flexDirection: "column", gap: ".5rem", width: "100%" }}>
            {[
              { label: "cache hit",   val: "96.3%", color: "var(--green-700)" },
              { label: "latency",     val: "0.8 ms", color: "var(--blue-700)" },
              { label: "evals / day", val: "24.6k",  color: "hsl(var(--primary))" },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: ".5625rem", color: "hsl(var(--muted-foreground))" }}>{s.label}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: ".5625rem", fontWeight: 700, color: s.color }}>{s.val}</span>
              </div>
            ))}
            <div style={{ height: 3, background: "hsl(var(--muted))", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: "96.3%", background: "hsl(var(--primary))", borderRadius: 2 }} />
            </div>
          </div>
        </Slice>

        {/* 3 — rollout */}
        <Slice>
          <span className="ff-logo-sub" style={{ marginBottom: ".25rem" }}>ROLLOUT · CRC32</span>
          <div style={{ display: "flex", flexDirection: "column", gap: ".5rem", width: "100%" }}>
            {[
              { label: "stripe-checkout-v2", pct: 10  },
              { label: "zendesk-ai-bot",     pct: 100 },
              { label: "datadog-rum",        pct: 5   },
            ].map(f => (
              <div key={f.label} style={{ display: "flex", flexDirection: "column", gap: ".2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: ".45rem", color: "hsl(var(--muted-foreground))", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120 }}>{f.label}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: ".45rem", color: "hsl(var(--primary))", fontWeight: 700 }}>{f.pct}%</span>
                </div>
                <div style={{ height: 2, background: "hsl(var(--muted))", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${f.pct}%`, background: "hsl(var(--primary))", borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        </Slice>

      </div>
    </div>
  );
}

// ─── Animated counter ─────────────────────────────────────────────────────────

function useCounter(target: number, decimals = 0, delay = 300) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;
    const timeoutId = setTimeout(() => {
      let cur = 0;
      const step = target / 40;
      intervalId = setInterval(() => {
        cur = Math.min(cur + step, target);
        setVal(parseFloat(cur.toFixed(decimals)));
        if (cur >= target && intervalId) clearInterval(intervalId);
      }, 16);
    }, delay);
    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [target, decimals, delay]);
  return val;
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, suffix = "", delta, deltaDir, icon }: {
  label: string; value: number; suffix?: string;
  delta: string; deltaDir: "up" | "down" | "neutral";
  icon: React.ReactNode;
}) {
  const displayed = useCounter(value, suffix === "%" ? 1 : 0, 300);
  const fmt =
    suffix === "%"  ? `+${displayed}%` :
    suffix === " ms" ? `${displayed} ms` :
    displayed.toLocaleString();
  return (
    <div className="ff-kpi-card">
      <div className="ff-kpi-icon">{icon}</div>
      <div className="ff-kpi-label">{label}</div>
      <div className="ff-kpi-value">{fmt}</div>
      <span className={`ff-kpi-delta ${deltaDir}`}>{delta}</span>
    </div>
  );
}

// ─── Canvas charts ────────────────────────────────────────────────────────────

function EvalChart({ dark }: { dark: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = canvas.offsetWidth * dpr;
    canvas.height = 160 * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    const w = canvas.offsetWidth, h = 160;
    const pad = { l: 32, r: 16, t: 12, b: 24 };
    const cw = w - pad.l - pad.r, ch = h - pad.t - pad.b;
    const evalMax = Math.max(...EVAL_DATA) * 1.1;
    const convMax = Math.max(...CONV_DATA) * 1.1;
    const gridC = dark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.06)";
    const textC = dark ? "rgba(255,255,255,.35)" : "rgba(0,0,0,.35)";
    const prim  = dark ? "hsl(263,91%,72%)"       : "hsl(262,83%,58%)";
    const green = dark ? "hsl(142,72%,55%)"        : "hsl(142,72%,36%)";
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) {
      const y = pad.t + (ch / 4) * i;
      ctx.strokeStyle = gridC; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + cw, y); ctx.stroke();
    }
    const ex = pad.l + (9 / (EVAL_DATA.length - 1)) * cw;
    ctx.strokeStyle = dark ? "rgba(180,130,255,.3)" : "rgba(110,50,220,.2)";
    ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ex, pad.t); ctx.lineTo(ex, pad.t + ch); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = prim; ctx.font = "500 9px Inter,sans-serif";
    ctx.fillText("enabled", ex + 3, pad.t + 12);
    function drawSeries(data: number[], maxV: number, color: string, alpha: number) {
      const pts = data.map((v, i) => ({
        x: pad.l + (i / (data.length - 1)) * cw,
        y: pad.t + ch - (v / maxV) * ch,
      }));
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pad.t + ch);
      pts.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.lineTo(pts[pts.length - 1].x, pad.t + ch);
      ctx.closePath();
      ctx.fillStyle = color.replace("hsl(", "hsla(").replace(")", `,${alpha})`);
      ctx.fill();
      ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        const cpx = pts[i - 1].x + (pts[i].x - pts[i - 1].x) * 0.5;
        ctx.bezierCurveTo(cpx, pts[i - 1].y, cpx, pts[i].y, pts[i].x, pts[i].y);
      }
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath();
      ctx.arc(pts[pts.length - 1].x, pts[pts.length - 1].y, 3, 0, Math.PI * 2);
      ctx.fillStyle = color; ctx.fill();
    }
    drawSeries(EVAL_DATA, evalMax, prim, 0.12);
    drawSeries(CONV_DATA, convMax, green, 0.10);
    ctx.fillStyle = textC; ctx.font = "9px Inter,sans-serif";
    [0, 4, 9, 13].forEach((i) => {
      const x = pad.l + (i / (EVAL_DATA.length - 1)) * cw;
      ctx.fillText(`d${i + 1}`, x - 4, h - 6);
    });
  }, [dark]);
  return <canvas ref={ref} style={{ width: "100%", height: "160px", display: "block" }} />;
}

function RolloutChart({ dark }: { dark: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 180 * dpr; canvas.height = 140 * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    const prim  = dark ? "hsl(263,91%,72%)" : "hsl(262,83%,58%)";
    const muted = dark ? "hsl(45,3%,28%)"   : "hsl(45,15%,80%)";
    let angle = -Math.PI / 2;
    [{ v: 0.62, c: prim }, { v: 0.38, c: muted }].forEach(({ v, c }) => {
      const end = angle + v * Math.PI * 2;
      ctx.beginPath(); ctx.arc(90, 65, 52, angle, end);
      ctx.arc(90, 65, 34, end, angle, true);
      ctx.closePath(); ctx.fillStyle = c; ctx.fill();
      angle = end;
    });
    ctx.fillStyle = dark ? "rgba(255,255,255,.85)" : "rgba(0,0,0,.8)";
    ctx.font = "bold 14px Inter,sans-serif"; ctx.textAlign = "center";
    ctx.fillText("62%", 90, 70);
    ctx.fillStyle = dark ? "rgba(255,255,255,.4)" : "rgba(0,0,0,.4)";
    ctx.font = "9px Inter,sans-serif";
    ctx.fillText("enabled", 90, 83);
  }, [dark]);
  return <canvas ref={ref} style={{ width: "180px", height: "140px", display: "block" }} />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div className="ff-home-wrap">

      {/* ── пиксельный фон ── */}
      <div className="ff-pixel-bg">
        <CssSpriteBackground />
      </div>


      {/* HERO */}
      <section className="ff-hero">
        <div className="ff-hero-text">
          <div className="ff-hero-badge">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" y1="22" x2="4" y2="15" stroke="currentColor" strokeWidth="2" />
            </svg>
            FF Manager
          </div>
          <h1 className="ff-hero-title">
            Feature flags<br />
            <span>management system</span>
          </h1>
          <p className="ff-hero-desc">
            Eval API с in-memory кешем, real-time SSE, multi-env и rollout-правила.
          </p>
          <ul className="ff-hero-features">
            {[
              "Eval API — кеш TTL, инвалидация по env/project, <1 мс",
              "Multi-environment: dev / staging / production + API-ключи",
              "Rollout по CRC32, targeting: userId, group, percentage",
              "Real-time SSE — UI обновляется без перезагрузки",
              "Stale-flag detection, audit log, GitHub Actions CI/CD",
            ].map((item) => (
              <li key={item} className="ff-hero-feature">
                <div className="ff-hero-feature-dot" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="ff-hero-cta">
            <Link href="/dashboard">
              <button className="ff-btn-primary">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Open Dashboard
              </button>
            </Link>
            <a href="#metrics">
              <button className="ff-btn-secondary">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                View Metrics
              </button>
            </a>
          </div>
        </div>
        <LogoStage />
      </section>

      {/* DIVIDER */}
      <div className="ff-section-divider"><hr /></div>

      {/* METRICS */}
      <section className="ff-metrics" id="metrics">
        <div className="ff-metrics-header">
          <div>
            <h2 className="ff-metrics-title">Flag Effectiveness Dashboard</h2>
            <p className="ff-metrics-subtitle">mock data · project ff-demo</p>
          </div>
          <span className="ff-metrics-meta">MOCK</span>
        </div>

        <div className="ff-kpi-grid">
          <KpiCard label="Active Flags" value={3} delta="↑ 2 this week" deltaDir="up"
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" y1="22" x2="4" y2="15" /></svg>} />
          <KpiCard label="Conversion Uplift" value={18.3} suffix="%" delta="vs control" deltaDir="up"
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="hsl(var(--green-700))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>} />
          <KpiCard label="Eval latency" value={1.2} suffix=" ms" delta="cache hit 96.3%" deltaDir="neutral"
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="hsl(var(--blue-700))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>} />
          <KpiCard label="Stale Flags" value={1} delta="review needed" deltaDir="down"
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="hsl(var(--amber-700))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>} />
        </div>

        <div className="ff-charts-row">
          <div className="ff-chart-card">
            <div className="ff-chart-card-header">
              <span className="ff-chart-card-title">Eval Requests vs Purchases — 14d</span>
              <span className="ff-chart-card-meta">stripe-checkout-v2</span>
            </div>
            <div className="ff-chart-body">
              <EvalChart dark={isDark} />
              <p className="ff-chart-note">
                После активации флага в production (день 10) конверсия выросла с ~5% до ~12%.
              </p>
            </div>
          </div>
          <div className="ff-chart-card">
            <div className="ff-chart-card-header">
              <span className="ff-chart-card-title">Rollout Coverage</span>
              <span className="ff-chart-card-meta">prod env</span>
            </div>
            <div className="ff-chart-body" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
              <RolloutChart dark={isDark} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".5rem", width: "100%", fontSize: "0.6875rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: ".375rem" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: "hsl(var(--primary))", flexShrink: 0, display: "inline-block" }} />
                  <span style={{ color: "hsl(var(--muted-foreground))" }}>Enabled <strong style={{ color: "hsl(var(--foreground))" }}>62%</strong></span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: ".375rem" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: "hsl(var(--muted-foreground))", opacity: .4, flexShrink: 0, display: "inline-block" }} />
                  <span style={{ color: "hsl(var(--muted-foreground))" }}>Disabled <strong style={{ color: "hsl(var(--foreground))" }}>38%</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="ff-chart-card" style={{ marginBottom: "1.75rem" }}>
          <div className="ff-chart-card-header">
            <span className="ff-chart-card-title">Flag States — Production</span>
            <span className="ff-chart-card-meta">3 flags · 1 project</span>
          </div>
          <div className="ff-chart-body" style={{ padding: 0 }}>
            <div style={{ overflowX: "auto" }}>
              <table className="ff-eval-table">
                <thead>
                  <tr>
                    <th>Flag Key</th><th>Name</th><th>Prod</th>
                    <th>Rollout</th><th>Evals 24h</th><th>Conversion ↑</th><th>Rule</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_FLAGS.map((f) => (
                    <tr key={f.key}>
                      <td><span className="ff-flag-key-badge">{f.key}</span></td>
                      <td style={{ fontSize: ".75rem", fontWeight: 500 }}>{f.name}</td>
                      <td><span className={`ff-enabled-chip ${f.enabled ? "on" : "off"}`}>{f.enabled ? "On" : "Off"}</span></td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                          <div className="ff-rollout-bar">
                            <div className="ff-rollout-bar-fill" style={{ width: `${f.rollout}%` }} />
                          </div>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: ".625rem", color: "hsl(var(--muted-foreground))" }}>{f.rollout}%</span>
                        </div>
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: ".75rem" }}>{f.evals.toLocaleString()}</td>
                      <td><span className={`ff-kpi-delta ${f.upliftDir}`} style={{ fontSize: ".6875rem" }}>{f.uplift}</span></td>
                      <td style={{ fontSize: ".625rem", color: "hsl(var(--muted-foreground))" }}>{f.rule}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <h3 className="ff-how-title">Как считается эффективность флага</h3>
        <div className="ff-how-row">
          {[
            { num: "01", tag: "Eval API · in-memory cache", title: "Фиксация eval-событий",
              desc: "При каждом GET /eval/:apiKey система фиксирует, какой вариант флага (true/false) получил userId. Это формирует exposed-группу для анализа." },
            { num: "02", tag: "Roadmap · Stage 9", title: "Целевое действие",
              desc: "SDK фиксирует конверсию: покупку, регистрацию, клик. В LaunchDarkly — track(), в Statsig — logEvent(). В FF Manager — POST /api/events (Stage 9)." },
            { num: "03", tag: "PostgreSQL CTE · Stage 9", title: "Расчёт uplift",
              desc: "SQL JOIN между eval_events и conversion_events по userId + flagId. Uplift = (CR_test − CR_control) / CR_control × 100%." },
          ].map((c) => (
            <div className="ff-how-card" key={c.num}>
              <div className="ff-how-card-num">{c.num}</div>
              <div className="ff-how-card-title">{c.title}</div>
              <div className="ff-how-card-desc">{c.desc}</div>
              <span className="ff-how-card-tag">{c.tag}</span>
            </div>
          ))}
        </div>
      </section>

      <footer className="ff-home-footer">
        <div className="ff-home-footer-dot" />
        <span>FF Manager — self-hosted feature flags · Go 1.22 · React 18 · PostgreSQL 16</span>
        <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: ".6875rem" }}>v1.0.0</span>
      </footer>

    </div>
  );
}