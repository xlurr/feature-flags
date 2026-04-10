import { useSetAtom } from "jotai";
import { startTourAtom } from "@/atoms/tour";
import { useLang } from "@/lib/i18n";

// ─── Pixel icons (8×8, 2px per pixel) ────���───────────────────────────────────

const PX = 2;

type PixelDef = [col: number, row: number, color: string][];

function PixelIcon({ pixels, size = 8 }: { pixels: PixelDef; size?: number }) {
  return (
    <div
      style={{
        position: "relative",
        width: size * PX,
        height: size * PX,
        imageRendering: "pixelated",
        flexShrink: 0,
      }}
    >
      {pixels.map(([c, r, color], i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: c * PX,
            top: r * PX,
            width: PX,
            height: PX,
            background: color,
          }}
        />
      ))}
    </div>
  );
}

// 8×8 pixel art icons
const ICON_REACT: PixelDef = [
  [3,0,"#61dafb"],[4,0,"#61dafb"],
  [1,1,"#61dafb"],[6,1,"#61dafb"],
  [0,2,"#61dafb"],[7,2,"#61dafb"],
  [0,3,"#61dafb"],[3,3,"#61dafb"],[4,3,"#61dafb"],[7,3,"#61dafb"],
  [0,4,"#61dafb"],[3,4,"#61dafb"],[4,4,"#61dafb"],[7,4,"#61dafb"],
  [0,5,"#61dafb"],[7,5,"#61dafb"],
  [1,6,"#61dafb"],[6,6,"#61dafb"],
  [3,7,"#61dafb"],[4,7,"#61dafb"],
];

const ICON_GO: PixelDef = [
  [1,1,"#00acd7"],[2,1,"#00acd7"],[3,1,"#00acd7"],[5,1,"#00acd7"],[6,1,"#00acd7"],
  [0,2,"#00acd7"],[4,2,"#00acd7"],[7,2,"#00acd7"],
  [0,3,"#00acd7"],[2,3,"#00acd7"],[3,3,"#00acd7"],[4,3,"#00acd7"],[7,3,"#00acd7"],
  [0,4,"#00acd7"],[4,4,"#00acd7"],[7,4,"#00acd7"],
  [1,5,"#00acd7"],[2,5,"#00acd7"],[3,5,"#00acd7"],[5,5,"#00acd7"],[6,5,"#00acd7"],
];

const ICON_DB: PixelDef = [
  [2,0,"#f59e0b"],[3,0,"#f59e0b"],[4,0,"#f59e0b"],[5,0,"#f59e0b"],
  [1,1,"#f59e0b"],[6,1,"#f59e0b"],
  [1,2,"#f59e0b"],[6,2,"#f59e0b"],
  [1,3,"#eab308"],[6,3,"#eab308"],
  [1,4,"#eab308"],[6,4,"#eab308"],
  [1,5,"#d97706"],[6,5,"#d97706"],
  [1,6,"#d97706"],[6,6,"#d97706"],
  [2,7,"#d97706"],[3,7,"#d97706"],[4,7,"#d97706"],[5,7,"#d97706"],
];

const ICON_SSE: PixelDef = [
  [1,0,"#22c55e"],[2,0,"#22c55e"],
  [3,1,"#22c55e"],[4,1,"#22c55e"],
  [5,2,"#22c55e"],[6,2,"#22c55e"],
  [3,3,"#16a34a"],[4,3,"#16a34a"],[5,3,"#16a34a"],[6,3,"#16a34a"],[7,3,"#16a34a"],
  [0,4,"#16a34a"],[1,4,"#16a34a"],[2,4,"#16a34a"],[3,4,"#16a34a"],[4,4,"#16a34a"],
  [1,5,"#22c55e"],[2,5,"#22c55e"],
  [3,6,"#22c55e"],[4,6,"#22c55e"],
  [5,7,"#22c55e"],[6,7,"#22c55e"],
];

const ICON_CACHE: PixelDef = [
  [3,0,"#a78bfa"],[4,0,"#a78bfa"],
  [2,1,"#a78bfa"],[5,1,"#a78bfa"],
  [0,2,"#7c3aed"],[1,2,"#7c3aed"],[6,2,"#7c3aed"],[7,2,"#7c3aed"],
  [0,3,"#7c3aed"],[3,3,"#c4b5fd"],[4,3,"#c4b5fd"],[7,3,"#7c3aed"],
  [0,4,"#7c3aed"],[3,4,"#c4b5fd"],[4,4,"#c4b5fd"],[7,4,"#7c3aed"],
  [0,5,"#7c3aed"],[1,5,"#7c3aed"],[6,5,"#7c3aed"],[7,5,"#7c3aed"],
  [2,6,"#a78bfa"],[5,6,"#a78bfa"],
  [3,7,"#a78bfa"],[4,7,"#a78bfa"],
];

const ICON_SHIELD: PixelDef = [
  [2,0,"#7c3aed"],[3,0,"#7c3aed"],[4,0,"#7c3aed"],[5,0,"#7c3aed"],
  [1,1,"#7c3aed"],[6,1,"#7c3aed"],
  [1,2,"#a78bfa"],[3,2,"#c4b5fd"],[4,2,"#c4b5fd"],[6,2,"#a78bfa"],
  [1,3,"#a78bfa"],[3,3,"#c4b5fd"],[6,3,"#a78bfa"],
  [1,4,"#a78bfa"],[4,4,"#c4b5fd"],[6,4,"#a78bfa"],
  [2,5,"#7c3aed"],[5,5,"#7c3aed"],
  [3,6,"#7c3aed"],[4,6,"#7c3aed"],
  [3,7,"#5b21b6"],
];

const ICON_GEAR: PixelDef = [
  [3,0,"#94a3b8"],[4,0,"#94a3b8"],
  [1,1,"#94a3b8"],[3,1,"#cbd5e1"],[4,1,"#cbd5e1"],[6,1,"#94a3b8"],
  [0,2,"#94a3b8"],[2,2,"#cbd5e1"],[3,2,"#e2e8f0"],[4,2,"#e2e8f0"],[5,2,"#cbd5e1"],[7,2,"#94a3b8"],
  [0,3,"#94a3b8"],[2,3,"#e2e8f0"],[5,3,"#e2e8f0"],[7,3,"#94a3b8"],
  [0,4,"#94a3b8"],[2,4,"#e2e8f0"],[5,4,"#e2e8f0"],[7,4,"#94a3b8"],
  [0,5,"#94a3b8"],[2,5,"#cbd5e1"],[3,5,"#e2e8f0"],[4,5,"#e2e8f0"],[5,5,"#cbd5e1"],[7,5,"#94a3b8"],
  [1,6,"#94a3b8"],[3,6,"#cbd5e1"],[4,6,"#cbd5e1"],[6,6,"#94a3b8"],
  [3,7,"#94a3b8"],[4,7,"#94a3b8"],
];

// ─── Tech stack data ─────────────────────────────────────────────────────────

const CURRENT_STACK = [
  {
    icon: ICON_REACT,
    titleRu: "Frontend",
    titleEn: "Frontend",
    descRu: "React 18, Vite, TailwindCSS, shadcn/ui, TanStack Query для кеширования запросов.",
    descEn: "React 18, Vite, TailwindCSS, shadcn/ui, TanStack Query for request caching.",
    tags: ["React 18", "Vite", "Tailwind", "shadcn/ui", "TanStack Query"],
  },
  {
    icon: ICON_GO,
    titleRu: "Backend API",
    titleEn: "Backend API",
    descRu: "Go 1.24, chi router, pgx/v5 (raw SQL). Clean Architecture: domain → ports → adapters.",
    descEn: "Go 1.24, chi router, pgx/v5 (raw SQL). Clean Architecture: domain → ports → adapters.",
    tags: ["Go 1.24", "chi", "pgx/v5", "Clean Arch"],
  },
  {
    icon: ICON_DB,
    titleRu: "База данных",
    titleEn: "Database",
    descRu: "PostgreSQL 16 с JSONB для targeting rules и diff payload. Индексы на hot paths.",
    descEn: "PostgreSQL 16 with JSONB for targeting rules and diff payload. Indexes on hot paths.",
    tags: ["PostgreSQL 16", "JSONB", "Drizzle ORM"],
  },
  {
    icon: ICON_SSE,
    titleRu: "Real-time обновления",
    titleEn: "Real-time Updates",
    descRu: "SSE EventBus — pub/sub по projectID. UI обновляется мгновенно при toggle флага.",
    descEn: "SSE EventBus — pub/sub by projectID. UI updates instantly on flag toggle.",
    tags: ["SSE", "EventBus", "TanStack invalidation"],
  },
  {
    icon: ICON_CACHE,
    titleRu: "In-Memory кеш",
    titleEn: "In-Memory Cache",
    descRu: "TTL 5 мин, инвалидация по env/project. Dual index: envIndex + projIndex. Latency <1ms.",
    descEn: "5min TTL, invalidation by env/project. Dual index: envIndex + projIndex. Latency <1ms.",
    tags: ["sync.RWMutex", "TTL", "CRC32 rollout"],
  },
  {
    icon: ICON_SHIELD,
    titleRu: "Состояние и i18n",
    titleEn: "State & i18n",
    descRu: "Jotai для атомарного стейта, React Context для i18n (RU/EN). Framer Motion анима��ии.",
    descEn: "Jotai for atomic state, React Context for i18n (RU/EN). Framer Motion animations.",
    tags: ["Jotai", "i18n", "Framer Motion", "Wouter"],
  },
];

const ROADMAP = [
  { stage: "0-5", labelRu: "Core system", labelEn: "Core system", descRu: "DB, repositories, services, DI, cache, SSE", descEn: "DB, repositories, services, DI, cache, SSE", status: "done" as const },
  { stage: "6", labelRu: "JWT аутентификация", labelEn: "JWT Authentication", descRu: "httpOnly cookies, bcrypt, RBAC (Admin/Viewer)", descEn: "httpOnly cookies, bcrypt, RBAC (Admin/Viewer)", status: "next" as const },
  { stage: "7", labelRu: "Targeting rules", labelEn: "Targeting Rules", descRu: "Rollout по userId, group, percentage", descEn: "Rollout by userId, group, percentage", status: "future" as const },
  { stage: "8", labelRu: "Go SDK", labelEn: "Go SDK", descRu: "Клиентский SDK для микросервисов с SSE + polling", descEn: "Client SDK for microservices with SSE + polling", status: "future" as const },
  { stage: "9", labelRu: "Observability", labelEn: "Observability", descRu: "Prometheus метрики, OpenTelemetry tracing", descEn: "Prometheus metrics, OpenTelemetry tracing", status: "future" as const },
  { stage: "10", labelRu: "Multi-project UI", labelEn: "Multi-project UI", descRu: "Поддержка нескольких проектов, project switcher", descEn: "Multiple project support, project switcher", status: "future" as const },
];

// ─── Architecture nodes ─────���────────────────────────────────────────────────

const ARCH_NODES = [
  { labelRu: "React SPA", labelEn: "React SPA", icon: ICON_REACT },
  { labelRu: "SSE / REST", labelEn: "SSE / REST", icon: ICON_SSE },
  { labelRu: "Go Service", labelEn: "Go Service", icon: ICON_GO },
  { labelRu: "Cache", labelEn: "Cache", icon: ICON_CACHE },
  { labelRu: "PostgreSQL", labelEn: "PostgreSQL", icon: ICON_DB },
];

// ─── Page ──────────��─────────────────────────────────────────────────────────

export default function DemoPage() {
  const startTour = useSetAtom(startTourAtom);
  const { lang, t } = useLang();
  const isRu = lang === "ru";

  return (
    <div className="ff-demo-wrap">
      <div className="ff-scanline" />

      {/* HERO */}
      <section className="ff-demo-hero">
        <div className="ff-hero-badge">
          <PixelIcon pixels={ICON_SHIELD} />
          TECH DEMO
        </div>
        <h1 className="ff-hero-title">
          {t.demoHeroTitle}
        </h1>
        <p className="ff-hero-desc" style={{ marginBottom: "1.5rem" }}>
          {t.demoHeroDesc}
        </p>
        <div className="ff-hero-cta">
          <button className="ff-btn-primary" onClick={startTour}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            {t.startTour}
          </button>
          <span style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>
            {t.demoCta}
          </span>
        </div>
      </section>

      {/* DIVIDER */}
      <div className="ff-section-divider"><hr /></div>

      {/* CURRENT TECH STACK */}
      <section className="ff-demo-section">
        <h2 className="ff-demo-section-title">
          <PixelIcon pixels={ICON_GEAR} />
          {t.demoCurrentStack}
        </h2>
        <div className="ff-demo-grid">
          {CURRENT_STACK.map((item, idx) => (
            <div className="ff-demo-card" key={idx}>
              <div className="ff-demo-card-header">
                <div className="ff-demo-card-icon">
                  <PixelIcon pixels={item.icon} />
                </div>
                <span className="ff-demo-card-title">
                  {isRu ? item.titleRu : item.titleEn}
                </span>
              </div>
              <div className="ff-demo-card-desc">
                {isRu ? item.descRu : item.descEn}
              </div>
              <div className="ff-demo-card-tags">
                {item.tags.map((tag) => (
                  <span className="ff-demo-tag" key={tag}>{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ARCHITECTURE */}
      <section className="ff-demo-section">
        <h2 className="ff-demo-section-title">
          {t.architecture}
        </h2>
        <div className="ff-demo-arch">
          {ARCH_NODES.map((node, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center" }}>
              <div className="ff-demo-arch-node">
                <div className="ff-demo-arch-icon">
                  <PixelIcon pixels={node.icon} />
                </div>
                <span className="ff-demo-arch-label">
                  {isRu ? node.labelRu : node.labelEn}
                </span>
              </div>
              {idx < ARCH_NODES.length - 1 && (
                <span className="ff-demo-arch-arrow">{">"}</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ROADMAP */}
      <section className="ff-demo-section">
        <h2 className="ff-demo-section-title">
          {t.roadmap}
        </h2>
        <div className="ff-demo-roadmap">
          {ROADMAP.map((item, idx) => (
            <div className="ff-demo-roadmap-step" key={idx}>
              <div className={`ff-demo-roadmap-bullet ${item.status}`}>
                {item.status === "done" ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span>{item.stage}</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="ff-demo-roadmap-label">
                  {isRu ? item.labelRu : item.labelEn}
                </div>
                <div className="ff-demo-roadmap-desc">
                  {isRu ? item.descRu : item.descEn}
                </div>
              </div>
              <span className={`ff-demo-roadmap-badge ${item.status}`}>
                {item.status === "done" ? (isRu ? "Готово" : "Done") :
                 item.status === "next" ? (isRu ? "Следующий" : "Next") :
                 (isRu ? "Планы" : "Planned")}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="ff-home-footer">
        <div className="ff-home-footer-dot" />
        <span>FF Manager — self-hosted feature flags</span>
        <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: ".6875rem" }}>
          Go 1.24 · React 18 · PostgreSQL 16
        </span>
      </footer>
    </div>
  );
}
