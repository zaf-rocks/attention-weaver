import { useCallback, useEffect, useRef, useState } from "react";
import type { Facet, FieldSettings } from "@/lib/noteworthy/types";
import { FIELD_EFFECTS } from "@/lib/noteworthy/effects";
import { facetVars } from "./FacetSurface";
import { FacetFront } from "./FacetFront";
import { InformationFace } from "./InformationFace";
import { CustomizeFace } from "./CustomizeFace";
import { EffectPicker, Slider } from "./EffectPicker";
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

type Mode = "info" | "customize" | "settings";
type Phase = "depart" | "travel" | "arrived" | "returning";

export function FacetOverlay({
  facet,
  positionLabel,
  settings,
  sourceRect,
  onPatch,
  onWeight,
  onSettings,
  onClose,
  onReset,
}: {
  facet: Facet;
  positionLabel: string;
  settings: FieldSettings;
  sourceRect: Rect;
  onPatch: (patch: Partial<Facet>) => void;
  onWeight: (tenths: number) => void;
  onSettings: (patch: Partial<FieldSettings>) => void;
  onClose: () => void;
  onReset: () => void;
}) {
  const reduced = settings.reducedMotion;
  const [mode, setMode] = useState<Mode>("info");
  const [phase, setPhase] = useState<Phase>("depart");
  const [rect, setRect] = useState<Rect>(sourceRect);
  const [angle, setAngle] = useState(0);
  const [spark, setSpark] = useState(false);
  const closing = useRef(false);

  const travelMs = reduced ? REDUCED_MS : TRAVEL_MS;
  const faceMs = reduced ? REDUCED_MS : FACE_MS;

  /* Depart from the exact tapped rect -> centered target. One trip only. */
  useEffect(() => {
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setRect(centeredTargetRect());
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
    setRect(sourceRect);
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
    if (!reduced) setAngle((a) => a + FACE_ROTATION);
  };

  const showFront = phase !== "arrived" && !reduced;
  const infoVisible = reduced ? mode === "info" : true;
  const thirdVisible = reduced ? mode !== "info" : true;

  const faceStyle = (rotate: number) => ({
    ...facetVars(facet, 0),
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
          transition: `left ${travelMs}ms ${TRAVEL_EASING}, top ${travelMs}ms ${TRAVEL_EASING}, width ${travelMs}ms ${TRAVEL_EASING}, height ${travelMs}ms ${TRAVEL_EASING}, opacity 320ms ease-out`,
          opacity: phase === "returning" ? 0 : 1,
          transformStyle: "preserve-3d",
          willChange: "left, top, width, height",
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
                  positionLabel={positionLabel}
                  onPatch={onPatch}
                  onWeight={onWeight}
                  onClose={close}
                  onCustomize={() => toMode("customize")}
                  onSettings={() => toMode("settings")}
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
                {mode === "settings" ? (
                  <div className="flex h-full flex-col">
                    <header className="flex items-center gap-2 border-b border-border/60 px-3 py-2">
                      <button
                        onClick={() => toMode("info")}
                        className="rounded-lg border border-border px-2 py-1 text-xs hover:bg-accent/25"
                      >
                        ‹ Information
                      </button>
                      <span className="nw-label ml-auto">Field settings</span>
                      <button
                        onClick={close}
                        aria-label="Return to field"
                        className="grid h-8 w-8 place-items-center rounded-full border border-border bg-card/70 text-sm"
                      >
                        ✕
                      </button>
                    </header>
                    <div className="nw-scroll flex-1 space-y-3 px-3 py-3">
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-[var(--primary)]"
                          checked={settings.reducedMotion}
                          onChange={(e) => onSettings({ reducedMotion: e.target.checked })}
                        />
                        Reduced motion
                      </label>
                      <Slider
                        label="Ambient motion"
                        value={settings.ambientMotion}
                        onChange={(v) => onSettings({ ambientMotion: v })}
                        suffix="%"
                      />
                      <Slider
                        label="Depth intensity"
                        value={settings.depth}
                        onChange={(v) => onSettings({ depth: v })}
                        suffix="%"
                      />
                      <EffectPicker
                        label="Field effect"
                        options={FIELD_EFFECTS}
                        value={settings.fieldEffect}
                        onChange={(v) => onSettings({ fieldEffect: v })}
                      />
                      <button
                        onClick={onReset}
                        className="w-full rounded-lg border border-destructive/60 py-2 text-xs tracking-widest text-destructive uppercase"
                      >
                        Reset field
                      </button>
                    </div>
                  </div>
                ) : (
                  <CustomizeFace
                    facet={facet}
                    onPatch={onPatch}
                    onBack={() => toMode("info")}
                    onClose={close}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
