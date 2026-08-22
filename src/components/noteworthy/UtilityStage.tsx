import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { Facet } from "@/lib/noteworthy/types";
import { facetVars } from "./FacetSurface";
import { centeredTargetRect, REDUCED_MS, TRAVEL_EASING, TRAVEL_MS, type Rect } from "@/lib/noteworthy/transform";

/**
 * Shared physical-selection primitive for the utility bars.
 *
 * Same doctrine as FacetOverlay: a fixed stage that is never transformed, and a
 * carrier that only changes position/size. The workspace unfolds from the exact
 * source bar rect and settles on the mathematically centered target rect.
 * No rotation here — utility objects unfold, they do not flip faces.
 */
export function UtilityStage({
  facet,
  sourceRect,
  reduced,
  onClose,
  children,
  testId,
}: {
  facet: Facet;
  sourceRect: Rect;
  reduced: boolean;
  onClose: () => void;
  children: (close: () => void) => ReactNode;
  testId: string;
}) {
  const [rect, setRect] = useState<Rect>(sourceRect);
  const [arrived, setArrived] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const closing = useRef(false);
  const travelMs = reduced ? REDUCED_MS : Math.round(TRAVEL_MS * 0.62);

  useEffect(() => {
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setRect(centeredTargetRect())),
    );
    const t = setTimeout(() => setArrived(true), travelMs);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [travelMs]);

  useEffect(() => {
    const recenter = () => {
      if (closing.current) return;
      setRect(centeredTargetRect());
    };
    const vv = window.visualViewport;
    window.addEventListener("resize", recenter);
    window.addEventListener("orientationchange", recenter);
    vv?.addEventListener("resize", recenter);
    vv?.addEventListener("scroll", recenter);
    return () => {
      window.removeEventListener("resize", recenter);
      window.removeEventListener("orientationchange", recenter);
      vv?.removeEventListener("resize", recenter);
      vv?.removeEventListener("scroll", recenter);
    };
  }, []);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    setLeaving(true);
    setRect(sourceRect);
    setTimeout(onClose, reduced ? REDUCED_MS : 380);
  }, [onClose, reduced, sourceRect]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [close]);

  return (
    <div className="nw-stage fixed inset-0 z-50" data-testid="nw-stage">
      <div
        className="nw-scrim absolute inset-0 bg-[oklch(0.05_0.02_270/0.66)]"
        onClick={close}
        data-testid="nw-scrim"
      />
      <div
        data-testid={testId}
        data-phase={leaving ? "returning" : arrived ? "arrived" : "travel"}
        style={{
          position: "fixed",
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          transition: `left ${travelMs}ms ${TRAVEL_EASING}, top ${travelMs}ms ${TRAVEL_EASING}, width ${travelMs}ms ${TRAVEL_EASING}, height ${travelMs}ms ${TRAVEL_EASING}, opacity 300ms ease-out`,
          opacity: leaving ? 0 : 1,
          willChange: "left, top, width, height",
        }}
      >
        <div
          className="nw-facet h-full w-full"
          style={{ ...facetVars(facet, 0), position: "absolute", inset: 0 }}
        >
          <div className={`nw-perimeter pfx-${facet.perimeterEffect}`} aria-hidden />
          <div
            className="relative z-[3] h-full"
            style={{ opacity: arrived ? 1 : 0, transition: "opacity 240ms ease-out" }}
          >
            {children(close)}
          </div>
        </div>
      </div>
    </div>
  );
}

export function WorkspaceHeader({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children?: ReactNode;
}) {
  return (
    <header className="flex items-center gap-2 border-b border-border/60 px-3 py-2">
      <div className="min-w-0">
        <h2 className="truncate font-display text-[12px] font-semibold tracking-[0.16em] uppercase">
          {title}
        </h2>
        {subtitle && <p className="truncate text-[9px] text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="ml-auto flex items-center gap-2">
        {children}
        <button
          onClick={onClose}
          aria-label="Return to field"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border bg-card/70 text-sm"
        >
          ✕
        </button>
      </div>
    </header>
  );
}
