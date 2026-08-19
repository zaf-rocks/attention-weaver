import type { Facet } from "@/lib/noteworthy/types";
import { PERIMETER_EFFECTS } from "@/lib/noteworthy/effects";
import { ColorField, EffectPicker, Slider } from "./EffectPicker";

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

        <div className="space-y-1.5">
          <span className="nw-label">Body gradient</span>
          <ColorField
            label="Endpoint A"
            value={facet.body.a}
            onChange={(v) => onPatch({ body: { ...facet.body, a: v } })}
          />
          <ColorField
            label="Endpoint B"
            value={facet.body.b}
            onChange={(v) => onPatch({ body: { ...facet.body, b: v } })}
          />
        </div>

        <div className="space-y-1.5">
          <span className="nw-label">Perimeter gradient</span>
          <ColorField
            label="Endpoint A"
            value={facet.perimeter.a}
            onChange={(v) => onPatch({ perimeter: { ...facet.perimeter, a: v } })}
          />
          <ColorField
            label="Endpoint B"
            value={facet.perimeter.b}
            onChange={(v) => onPatch({ perimeter: { ...facet.perimeter, b: v } })}
          />
        </div>

        <EffectPicker
          label="Perimeter effect"
          options={PERIMETER_EFFECTS}
          value={facet.perimeterEffect}
          onChange={(v) => onPatch({ perimeterEffect: v })}
        />

        <Slider
          label="Glow intensity"
          value={facet.glow}
          onChange={(v) => onPatch({ glow: v })}
          suffix="%"
        />
        <Slider
          label="Effect speed"
          value={facet.effectSpeed}
          onChange={(v) => onPatch({ effectSpeed: v })}
          suffix="%"
        />
        <Slider
          label="Motion intensity"
          value={facet.motion}
          onChange={(v) => onPatch({ motion: v })}
          suffix="%"
        />

        <div
          className="nw-facet h-20"
          style={
            {
              ["--body-a" as string]: facet.body.a,
              ["--body-b" as string]: facet.body.b,
              ["--per-a" as string]: facet.perimeter.a,
              ["--per-b" as string]: facet.perimeter.b,
              ["--glow" as string]: facet.glow / 100,
              ["--speed" as string]: facet.effectSpeed / 100,
            } as React.CSSProperties
          }
        >
          <div className={`nw-perimeter pfx-${facet.perimeterEffect}`} aria-hidden />
          <div className="relative z-[3] grid h-full place-items-center text-xs tracking-[0.2em] uppercase">
            Live preview
          </div>
        </div>
      </div>
    </div>
  );
}
