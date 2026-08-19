import { useEffect, useState } from "react";
import type { Facet, FieldSettings } from "@/lib/noteworthy/types";
import { FIELD_EFFECTS } from "@/lib/noteworthy/effects";
import { facetVars } from "./FacetSurface";
import { InformationFace } from "./InformationFace";
import { CustomizeFace } from "./CustomizeFace";
import { EffectPicker, Slider } from "./EffectPicker";

type Mode = "info" | "customize" | "settings";

export function FacetOverlay({
  facet,
  positionLabel,
  settings,
  onPatch,
  onWeight,
  onSettings,
  onClose,
  onReset,
}: {
  facet: Facet;
  positionLabel: string;
  settings: FieldSettings;
  onPatch: (patch: Partial<Facet>) => void;
  onWeight: (tenths: number) => void;
  onSettings: (patch: Partial<FieldSettings>) => void;
  onClose: () => void;
  onReset: () => void;
}) {
  const [mode, setMode] = useState<Mode>("info");
  const [spark, setSpark] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setSpark(false), 460);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", esc);
    };
  }, [onClose]);

  const flipped = mode !== "info";

  return (
    <div className="nw-stage fixed inset-0 z-50 grid place-items-center p-3">
      <div className="nw-scrim absolute inset-0 bg-[oklch(0.05_0.02_270/0.72)]" onClick={onClose} />
      <div className="nw-spinner relative h-[86%] w-full max-w-[420px]">
        <div
          className="relative h-full w-full transition-transform duration-[900ms] [transform-style:preserve-3d]"
          style={{
            transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)",
            transform: `rotateY(${flipped ? 360 : 180}deg)`,
          }}
        >
          {/* Information face */}
          <div
            className="nw-face nw-facet absolute inset-0"
            style={{ ...facetVars(facet, 0), backfaceVisibility: "hidden" }}
          >
            <div className={`nw-perimeter pfx-${facet.perimeterEffect}`} aria-hidden />
            {spark && <div className="nw-sparkflash absolute inset-0 rounded-[14px]" aria-hidden />}
            <div className="relative z-[3] h-full">
              <InformationFace
                facet={facet}
                positionLabel={positionLabel}
                onPatch={onPatch}
                onWeight={onWeight}
                onClose={onClose}
                onCustomize={() => setMode("customize")}
                onSettings={() => setMode("settings")}
              />
            </div>
          </div>

          {/* Third physical state */}
          <div
            className="nw-face nw-facet absolute inset-0"
            style={{
              ...facetVars(facet, 0),
              transform: "rotateY(180deg)",
              backfaceVisibility: "hidden",
            }}
          >
            <div className={`nw-perimeter pfx-${facet.perimeterEffect}`} aria-hidden />
            <div className="relative z-[3] h-full">
              {mode === "settings" ? (
                <div className="flex h-full flex-col">
                  <header className="flex items-center gap-2 border-b border-border/60 px-3 py-2">
                    <button
                      onClick={() => setMode("info")}
                      className="rounded-lg border border-border px-2 py-1 text-xs hover:bg-accent/25"
                    >
                      ‹ Information
                    </button>
                    <span className="nw-label ml-auto">Field settings</span>
                    <button
                      onClick={onClose}
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
                  onBack={() => setMode("info")}
                  onClose={onClose}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
