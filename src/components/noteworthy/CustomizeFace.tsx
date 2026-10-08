import type { Facet } from "@/lib/noteworthy/types";
import { BODY_EFFECTS, PERIMETER_EFFECTS } from "@/lib/noteworthy/effects";
import { EffectPicker, Slider } from "./EffectPicker";
import { ColorStudio } from "./ColorStudio";
import { FacetSurface } from "./FacetSurface";
import { FacetFront } from "./FacetFront";
import { ColorDrawer } from "./ColorDrawer";
import { MarkPicker } from "./MarkPicker";
import { useState } from "react";
import type { Gradient } from "@/lib/noteworthy/types";
import { gradientCss } from "@/lib/noteworthy/color";

type Which = "body" | "edge" | "text";
const stopsOf = (g: Gradient) => (g.stops && g.stops.length >= 3 ? g.stops : [g.a, g.b]);

function Pill({ label, g, onClick }: { label: string; g: Gradient; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      data-testid={`nw-pill-${label.toLowerCase().split(" ")[0]}`}
      className="flex min-w-0 flex-1 flex-col items-stretch gap-1 rounded-lg border border-border/60 bg-card/40 px-2 py-1.5 text-left hover:border-primary/70"
    >
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className="h-3 rounded-full border border-border/50" style={{ background: gradientCss(stopsOf(g)) }} />
    </button>
  );
}

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
  const [open, setOpen] = useState<Which | null>(null);
  const textG: Gradient = facet.text ?? { a: "#f5f7ff", b: facet.perimeter.b };
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
        <MarkPicker value={facet.icon} onChange={(m) => onPatch({ icon: m })} />

        <div>
          <span className="nw-label">Colors</span>
          <div className="mt-1 flex gap-1.5">
            <Pill label="Body" g={facet.body} onClick={() => setOpen("body")} />
            <Pill label="Edge" g={facet.perimeter} onClick={() => setOpen("edge")} />
            <Pill label={facet.text ? "Text & mark" : "Text (matches edge)"} g={textG} onClick={() => setOpen("text")} />
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

      </div>

      {open && (
        <ColorDrawer
          title={open === "body" ? "Body colors · deep tones" : open === "edge" ? "Edge colors · bright tones" : "Text & mark colors"}
          onClose={() => setOpen(null)}
        >
          {open === "text" && (
            <label className="mb-2 flex items-center justify-between rounded-lg border border-border/60 px-2 py-1 text-[11px]">
              Match edge color (default)
              <input
                type="checkbox"
                checked={facet.text === null}
                onChange={(e) => onPatch({ text: e.target.checked ? null : textG })}
              />
            </label>
          )}
          <ColorStudio
            key={open}
            tone={open}
            value={open === "body" ? facet.body : open === "edge" ? facet.perimeter : textG}
            onChange={(g) =>
              onPatch(open === "body" ? { body: g } : open === "edge" ? { perimeter: g } : { text: g })
            }
          />
        </ColorDrawer>
      )}
    </div>
  );
}
