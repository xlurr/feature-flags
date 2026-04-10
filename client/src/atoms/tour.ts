import { atom } from "jotai";

// ─── Types ───────────────────────────────────────────────────────────────────

export type TourPlacement = "top" | "bottom" | "left" | "right";

export interface TourStep {
  id: string;
  targetSelector: string;
  route: string;
  titleKey: string;
  descKey: string;
  placement: TourPlacement;
}

// ─── Steps config ────────────────────────────────────────────────────────────

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    targetSelector: ".ff-topnav-links",
    route: "/demo",
    titleKey: "tourStep0Title",
    descKey: "tourStep0Desc",
    placement: "bottom",
  },
  {
    id: "dashboard-stats",
    targetSelector: "[data-tour='stats-grid']",
    route: "/dashboard",
    titleKey: "tourStep1Title",
    descKey: "tourStep1Desc",
    placement: "bottom",
  },
  {
    id: "dashboard-env",
    targetSelector: "[data-tour='env-status']",
    route: "/dashboard",
    titleKey: "tourStep2Title",
    descKey: "tourStep2Desc",
    placement: "bottom",
  },
  {
    id: "flags-table",
    targetSelector: "[data-tour='flags-table']",
    route: "/flags",
    titleKey: "tourStep3Title",
    descKey: "tourStep3Desc",
    placement: "bottom",
  },
  {
    id: "audit-log",
    targetSelector: "[data-tour='audit-table']",
    route: "/audit",
    titleKey: "tourStep4Title",
    descKey: "tourStep4Desc",
    placement: "bottom",
  },
  {
    id: "eval-api",
    targetSelector: "[data-tour='eval-section']",
    route: "/eval",
    titleKey: "tourStep5Title",
    descKey: "tourStep5Desc",
    placement: "bottom",
  },
  {
    id: "sse-indicator",
    targetSelector: ".ff-sse-dot",
    route: "/eval",
    titleKey: "tourStep6Title",
    descKey: "tourStep6Desc",
    placement: "bottom",
  },
  {
    id: "i18n-theme",
    targetSelector: ".ff-lang-switch",
    route: "/settings",
    titleKey: "tourStep7Title",
    descKey: "tourStep7Desc",
    placement: "bottom",
  },
];

// ─── Atoms ───────────────────────────────────────────────────────────────────

export const tourActiveAtom = atom(false);
export const tourCurrentIdxAtom = atom(0);

export const currentStepAtom = atom<TourStep | null>((get) => {
  if (!get(tourActiveAtom)) return null;
  return TOUR_STEPS[get(tourCurrentIdxAtom)] ?? null;
});

export const tourProgressAtom = atom((get) => ({
  current: get(tourCurrentIdxAtom) + 1,
  total: TOUR_STEPS.length,
}));

// ─── Action atoms ────────────────────────────────────────────────────────────

export const startTourAtom = atom(null, (_get, set) => {
  set(tourCurrentIdxAtom, 0);
  set(tourActiveAtom, true);
});

export const endTourAtom = atom(null, (_get, set) => {
  set(tourActiveAtom, false);
  set(tourCurrentIdxAtom, 0);
});

export const nextStepAtom = atom(null, (get, set) => {
  const idx = get(tourCurrentIdxAtom);
  if (idx < TOUR_STEPS.length - 1) {
    set(tourCurrentIdxAtom, idx + 1);
  } else {
    set(tourActiveAtom, false);
    set(tourCurrentIdxAtom, 0);
  }
});

export const prevStepAtom = atom(null, (get, set) => {
  const idx = get(tourCurrentIdxAtom);
  if (idx > 0) {
    set(tourCurrentIdxAtom, idx - 1);
  }
});
