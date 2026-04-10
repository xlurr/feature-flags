import { useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { createPortal } from "react-dom";
import {
  tourActiveAtom,
  currentStepAtom,
  endTourAtom,
  nextStepAtom,
  prevStepAtom,
} from "@/atoms/tour";
import { TourOverlay } from "./TourOverlay";
import { TourTooltip } from "./TourTooltip";

export function TourProvider({ children }: { children: React.ReactNode }) {
  const isActive = useAtomValue(tourActiveAtom);
  const step = useAtomValue(currentStepAtom);
  const end = useSetAtom(endTourAtom);
  const next = useSetAtom(nextStepAtom);
  const prev = useSetAtom(prevStepAtom);
  const [, navigate] = useLocation();

  // Navigate to the step's route when it changes
  useEffect(() => {
    if (!isActive || !step) return;
    navigate(step.route);
  }, [isActive, step, navigate]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isActive) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") end();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isActive, end, next, prev]);

  return (
    <>
      {children}
      {isActive &&
        createPortal(
          <>
            <TourOverlay />
            <TourTooltip />
          </>,
          document.body,
        )}
    </>
  );
}
