import { useAtomValue, useSetAtom } from "jotai";
import {
  currentStepAtom,
  tourProgressAtom,
  nextStepAtom,
  prevStepAtom,
  endTourAtom,
  type TourPlacement,
} from "@/atoms/tour";
import { useLang } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import type { Translations } from "@/lib/i18n";

const PAD = 8;
const TOOLTIP_GAP = 12;
const TOOLTIP_W = 340;
const TOOLTIP_H_EST = 180; // estimated tooltip height
const MAX_HIGHLIGHT_H = 300;

function getTooltipPosition(
  rect: DOMRect | null,
  placement: TourPlacement,
): { top: number; left: number; actualPlacement: TourPlacement } {
  if (!rect) return { top: 100, left: 100, actualPlacement: placement };

  const vh = window.innerHeight;
  const vw = window.innerWidth;
  const cappedBottom = rect.top + Math.min(rect.height, MAX_HIGHLIGHT_H);

  // Auto-flip: if "bottom" but not enough space below, flip to "top"
  let actual = placement;
  if (actual === "bottom" && cappedBottom + PAD + TOOLTIP_GAP + TOOLTIP_H_EST > vh) {
    actual = "top";
  }
  if (actual === "top" && rect.top - PAD - TOOLTIP_GAP - TOOLTIP_H_EST < 0) {
    actual = "bottom";
  }

  // Clamp left to keep tooltip within viewport
  const clampLeft = (l: number) => Math.max(16, Math.min(l, vw - TOOLTIP_W - 16));

  switch (actual) {
    case "bottom":
      return {
        top: cappedBottom + PAD + TOOLTIP_GAP,
        left: clampLeft(rect.left + rect.width / 2 - TOOLTIP_W / 2),
        actualPlacement: actual,
      };
    case "top":
      return {
        top: rect.top - PAD - TOOLTIP_GAP - TOOLTIP_H_EST,
        left: clampLeft(rect.left + rect.width / 2 - TOOLTIP_W / 2),
        actualPlacement: actual,
      };
    case "left":
      return {
        top: Math.max(16, rect.top + rect.height / 2 - 80),
        left: Math.max(16, rect.left - PAD - TOOLTIP_GAP - TOOLTIP_W),
        actualPlacement: actual,
      };
    case "right":
      return {
        top: Math.max(16, rect.top + rect.height / 2 - 80),
        left: rect.right + PAD + TOOLTIP_GAP,
        actualPlacement: actual,
      };
  }
}

export function TourTooltip() {
  const step = useAtomValue(currentStepAtom);
  const progress = useAtomValue(tourProgressAtom);
  const next = useSetAtom(nextStepAtom);
  const prev = useSetAtom(prevStepAtom);
  const end = useSetAtom(endTourAtom);
  const { t } = useLang();
  const [rect, setRect] = useState<DOMRect | null>(null);

  const measure = useCallback(() => {
    if (!step) return;
    const el = document.querySelector(step.targetSelector);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      setRect(el.getBoundingClientRect());
    }
  }, [step]);

  useEffect(() => {
    const timerIds: ReturnType<typeof setTimeout>[] = [];
    const delays = [0, 50, 120, 250, 500, 800, 1200];

    delays.forEach((ms) => {
      timerIds.push(setTimeout(measure, ms));
    });

    const onLayout = () => measure();
    window.addEventListener("resize", onLayout);
    window.addEventListener("scroll", onLayout, true);

    return () => {
      timerIds.forEach(clearTimeout);
      window.removeEventListener("resize", onLayout);
      window.removeEventListener("scroll", onLayout, true);
    };
  }, [step, measure]);

  if (!step) return null;

  const { top, left } = getTooltipPosition(rect, step.placement);
  const isLast = progress.current === progress.total;
  const titleKey = step.titleKey as keyof Translations;
  const descKey = step.descKey as keyof Translations;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step.id}
        className="ff-tour-tooltip"
        style={{ top, left, maxWidth: TOOLTIP_W }}
        initial={{ opacity: 0, y: 8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
      >
        <div className="ff-tour-tooltip-step">
          {progress.current} {t.tourStepOf} {progress.total}
        </div>
        <div className="ff-tour-tooltip-title">{t[titleKey]}</div>
        <div className="ff-tour-tooltip-desc">{t[descKey]}</div>
        <div className="ff-tour-tooltip-nav">
          {progress.current > 1 && (
            <button className="ff-btn-secondary" onClick={prev}>
              {t.tourPrev}
            </button>
          )}
          <button className="ff-btn-primary" onClick={next}>
            {isLast ? t.tourFinish : t.tourNext}
          </button>
          {!isLast && (
            <button className="ff-tour-skip" onClick={end}>
              {t.tourSkip}
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
