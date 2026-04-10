import { useAtomValue, useSetAtom } from "jotai";
import { currentStepAtom, endTourAtom } from "@/atoms/tour";
import { useState, useEffect, useCallback } from "react";

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 8;
const MAX_HIGHLIGHT_H = 300;

export function TourOverlay() {
  const step = useAtomValue(currentStepAtom);
  const endTour = useSetAtom(endTourAtom);
  const [rect, setRect] = useState<TargetRect | null>(null);

  const measure = useCallback(() => {
    if (!step) return;
    const el = document.querySelector(step.targetSelector);
    if (!el) {
      setRect(null);
      return;
    }
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    const r = el.getBoundingClientRect();
    const cappedH = Math.min(r.height, MAX_HIGHLIGHT_H);
    setRect({
      top: r.top - PAD,
      left: r.left - PAD,
      width: r.width + PAD * 2,
      height: cappedH + PAD * 2,
    });
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

  const clipPath = rect
    ? `polygon(
        0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%,
        ${rect.left}px ${rect.top}px,
        ${rect.left}px ${rect.top + rect.height}px,
        ${rect.left + rect.width}px ${rect.top + rect.height}px,
        ${rect.left + rect.width}px ${rect.top}px,
        ${rect.left}px ${rect.top}px
      )`
    : "none";

  return (
    <>
      <div
        className="ff-tour-overlay"
        style={{ clipPath }}
        onClick={endTour}
      />
      {rect && (
        <div
          className="ff-tour-spotlight"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          }}
        />
      )}
    </>
  );
}
