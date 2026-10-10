import { useCallback, useEffect, useRef, useState } from "react";
import type { Facet, FieldSettings, SlotId } from "@/lib/noteworthy/types";
import { facetVars } from "./FacetSurface";
import { FacetFront } from "./FacetFront";
import { InformationFace } from "./InformationFace";
import { CustomizeFace } from "./CustomizeFace";
import {
  centeredTargetRect,
  ENTRANCE_ROTATION,
  FACE_MS,
  FACE_ROTATION,
  REDUCED_MS,
  TRAVEL_EASING,
  TRAVEL_MS,
  type Rect,
} from "@/lib/noteworthy/transform";

type Mode = "info" | "customize";
type Phase = "depart" | "travel" | "arrived" | "returning";

export function FacetOverlay({
  facet,
  settings,
  sourceRect,
  onPatch,
  onClose,
  others,
  onSwap,
}: {
  facet: Facet;
  settings: FieldSettings;
  sourceRect: Rect;
  onPatch: (patch: Partial<Facet>) => void;
  onClose: () => void;
  others?: { id: SlotId; title: string; positionName: string }[];
  onSwap?: (target: SlotId) => void;
}) {
  const reduced = settings.reducedMotion;
  const [mode, setMode] = useState<Mode>("info");
  const [phase, setPhase] = useState<Phase>("depart");
  const [rect, setRect] = useState<Rect>(() => centeredTargetRect());
  const [atSource, setAtSource] = useState(true);
  const [angle, setAngle] = useState(0);
  const [spark, setSpark] = useState(false);
  const closing = useRef(false);
  const [turning, setTurning] = useState(false);
  const turnTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(turnTimer.current), []);

  const travelMs = reduced ? REDUCED_MS : TRAVEL_MS;
  const faceMs = reduced ? REDUCED_MS : FACE_MS;

  /* Depart from the exact tapped rect -> centered target. One trip only. */
  useEffect(() => {
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setAtSource(false);
        if (!reduced) setAngle(ENTRANCE_ROTATION);
        setPhase("travel");
      }),
    );
    const arrive = setTimeout(() => {
      setPhase("arrived");
      setSpark(true);
      setTimeout(() => setSpark(false), 460);
    }, travelMs);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(arrive);
    };
  }, [reduced, travelMs]);

  /* The carrier's centered rect must survive viewport changes (URL bar, keyboard). */
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
    setPhase("returning");
    setAtSource(true);
    setTimeout(onClose, reduced ? REDUCED_MS : 420);
  }, [onClose, reduced, sourceRect]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [close]);

  /* Only the object rotates. The carrier never moves again. */
  const toMode = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    // Keep both faces only while the turn is in flight, then drop the hidden one.
    setTurning(true);
    window.clearTimeout(turnTimer.current);
    turnTimer.current = window.setTimeout(() => setTurning(false), (reduced ? REDUCED_MS : FACE_MS) + 60);
    if (!reduced) setAngle((a) => a + FACE_ROTATION);
  };

  const showFront = phase !== "arrived" && !reduced;
  const infoVisible = mode === "info" || (!reduced && turning);
  const thirdVisible = phase === "arrived" && (mode === "customize" || (!reduced && turning));

  const faceStyle = (rotate: number) => ({
    ...facetVars(facet, 0),
    // Explicit absolute positioning: .nw-facet's own `position: relative`
    // outranks Tailwind's layered utilities, which would let the face grow
    // past the carrier and push the footer/× below the viewport.
    position: "absolute" as const,
    inset: 0,
    transform: reduced ? undefined : `rotateY(${rotate}deg)`,
    backfaceVisibility: "hidden" as const,
  });

  return (
    <div className="nw-stage fixed inset-0 z-50" data-testid="nw-stage">
      <div
        className="nw-scrim absolute inset-0 bg-[oklch(0.05_0.02_270/0.66)]"
        onClick={close}
        data-testid="nw-scrim"
      />

      {/* CARRIER — position + size only. Never rotated, never scaled. */}
      <div
        data-testid="nw-carrier"
        data-phase={phase}
        data-mode={mode}
        style={{
          position: "fixed",
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          // GPU-only travel: the carrier sits at its centered rect and a single
          // translate+scale transform carries it from the tapped facet's rect.
          transformOrigin: "0 0",
          transform: atSource
            ? `translate3d(${sourceRect.left - rect.left}px, ${sourceRect.top - rect.top}px, 0) scale(${sourceRect.width / rect.width}, ${sourceRect.height / rect.height})`
            : "translate3d(0,0,0) scale(1,1)",
          transition: `transform ${phase === "returning" ? (reduced ? REDUCED_MS : 420) : travelMs}ms ${TRAVEL_EASING}, opacity 320ms ease-out`,
          opacity: phase === "returning" ? 0 : 1,
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      >
        {/* ROTATOR — rotation only, about its own center. */}
        <div
          data-testid="nw-rotator"
          data-angle={angle}
          className="relative h-full w-full"
          style={{
            transformStyle: "preserve-3d",
            transformOrigin: "50% 50%",
            transform: reduced ? undefined : `rotateY(${angle}deg)`,
            transition: `transform ${phase === "arrived" ? faceMs : travelMs}ms ${TRAVEL_EASING}`,
          }}
        >
          {/* Real front face during departure */}
          {showFront && (
            <div className="nw-face nw-facet absolute inset-0" style={faceStyle(0)} aria-hidden>
              <div className={`nw-perimeter pfx-${facet.perimeterEffect}`} />
              <FacetFront facet={facet} scale="xl" />
            </div>
          )}

          {/* Information face (reverse) */}
          {infoVisible && (
            <div
              className="nw-face nw-facet absolute inset-0"
              data-testid="nw-face-information"
              style={faceStyle(180)}
            >
              <div className={`nw-perimeter pfx-${facet.perimeterEffect}`} aria-hidden />
              {spark && <div className="nw-sparkflash absolute inset-0 rounded-[14px]" aria-hidden />}
              <div className="relative z-[3] h-full">
                <InformationFace
                  facet={facet}
                  onPatch={onPatch}
                  onClose={close}
                  onCustomize={() => toMode("customize")}
                  others={others}
                  onSwap={onSwap}
                />
              </div>
            </div>
          )}

          {/* False third physical state */}
          {thirdVisible && (
            <div
              className="nw-face nw-facet absolute inset-0"
              data-testid="nw-face-third"
              style={faceStyle(0)}
            >
              <div className={`nw-perimeter pfx-${facet.perimeterEffect}`} aria-hidden />
              <div className="relative z-[3] h-full">
                  <CustomizeFace
                    facet={facet}
                    onPatch={onPatch}
                    onBack={() => toMode("info")}
                    onClose={close}
                  />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
