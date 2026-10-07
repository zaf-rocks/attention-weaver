import type { Facet } from "@/lib/noteworthy/types";
import { BODY_EFFECTS, PERIMETER_EFFECTS } from "@/lib/noteworthy/effects";
import { EffectPicker, Slider } from "./EffectPicker";
import { ColorStudio } from "./ColorStudio";
import { FacetSurface } from "./FacetSurface";
import { FacetFront } from "./FacetFront";

const MARKS = ["◉", "✦", "◐", "❖", "△", "⬡", "≋", "▤", "⌬", "⚙", "❤", "◇", "↻", "⌂", "◎"];

export function CustomizeFace({
  facet,
  onPatch,
  onBack,
  onClose,
}: {
  facet: Facet;
  onPatch: (patch: Partial<Facet>) => void;
  onBack: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 border-b border-border/60 px-3 py-2">
        <button
          onClick={onBack}
          className="rounded-lg border border-border px-2 py-1 text-xs hover:bg-accent/25"
        >
          ‹ Information
        </button>
        <span className="nw-label ml-auto">Customize</span>
        <button
          onClick={onClose}
          aria-label="Return to field"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border bg-card/70 text-sm hover:bg-accent/30"
        >
          ✕
        </button>
      </header>

      {/* Pinned live preview — always visible while editing */}
      <div className="shrink-0 border-b border-border/60 px-3 py-2" data-testid="nw-customize-preview">
        <div className="mx-auto aspect-[4/3] max-h-[26dvh] w-[62%] max-w-[calc(26dvh*4/3)]">
          <FacetSurface facet={facet} ambient={60} float={false} className="h-full w-full">
            <FacetFront facet={facet} scale="lg" />
          </FacetSurface>
        </div>
      </div>

      <div className="nw-scroll flex-1 space-y-3 px-3 py-3">
        <div>
          <span className="nw-label">Center mark</span>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {MARKS.map((m) => (
              <button
                key={m}
                onClick={() => onPatch({ icon: m })}
                aria-label={`Use mark ${m}`}
                className={`grid h-8 w-8 place-items-center rounded-lg border text-sm ${
                  facet.icon === m ? "border-primary text-primary" : "border-border/60"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <EffectPicker
          label="Inside effect"
          options={BODY_EFFECTS}
          value={facet.bodyEffect ?? "none"}
          onChange={(v) => onPatch({ bodyEffect: v })}
        />
        <EffectPicker
          label="Edge effect"
          options={PERIMETER_EFFECTS}
          value={facet.perimeterEffect}
          onChange={(v) => onPatch({ perimeterEffect: v })}
        />
        <label className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-2 py-1.5">
          <span className="nw-label">Color shifting edge</span>
          <input
            type="checkbox"
            checked={Boolean(facet.colorShift)}
            onChange={(e) => onPatch({ colorShift: e.target.checked })}
            aria-label="Color shifting edge"
          />
        </label>

        <Slider label="Glow intensity" value={facet.glow} onChange={(v) => onPatch({ glow: v })} suffix="%" />
        <Slider
          label="Effect speed"
          value={facet.effectSpeed}
          onChange={(v) => onPatch({ effectSpeed: v })}
          suffix="%"
        />
        <Slider label="Motion intensity" value={facet.motion} onChange={(v) => onPatch({ motion: v })} suffix="%" />

        <ColorStudio label="Body gradient" value={facet.body} onChange={(g) => onPatch({ body: g })} />
        <ColorStudio
          label="Edge gradient"
          value={facet.perimeter}
          onChange={(g) => onPatch({ perimeter: g })}
        />
      </div>
    </div>
  );
}
