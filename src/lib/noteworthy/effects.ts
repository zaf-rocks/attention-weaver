export type EffectOption = { id: string; name: string; hint: string };

/** Perimeter effects — a small set of dramatic, verified-visible effects. */
export const PERIMETER_EFFECTS: EffectOption[] = [
  { id: "none", name: "Inert", hint: "Quiet edge, no motion." },
  { id: "plasma", name: "Plasma Chase", hint: "A glowing plasma ball races the edge with a color trail." },
  { id: "rotate", name: "Color Shift", hint: "The whole edge cycles through the spectrum." },
  { id: "voltage", name: "Voltage Surge", hint: "Erratic electrocuted flicker in color and brightness." },
  { id: "glitch", name: "Glitch", hint: "Sharp digital tears along the edge." },
  { id: "nodes", name: "Node Nexus", hint: "Bright corner nodes fire in sequence." },
  { id: "burn", name: "Ember Burn", hint: "Molten anodized heat smoldering along the edge." },
  { id: "breathe", name: "Breathing Halo", hint: "A deep halo that swells in and out." },
];

/** Interior (facet body) effects — live inside each facet's glass. */
export const BODY_EFFECTS: EffectOption[] = [
  { id: "none", name: "Still", hint: "Plain body gradient." },
  { id: "parade", name: "Color Parade", hint: "A cycling parade of gradients flows through the body." },
  { id: "prism", name: "Prism Bleed", hint: "Spectral light refracts across the glass." },
  { id: "swell", name: "Swell", hint: "The whole facet swells and contorts, then settles." },
  { id: "voltage", name: "Inner Voltage", hint: "The interior spasms with electric flashes." },
];

/** Field (background behind facets) effects. */
export const FIELD_EFFECTS: EffectOption[] = [
  { id: "none", name: "Void", hint: "" },
  { id: "gridscan", name: "Grid Scan", hint: "" },
  { id: "constellation", name: "Constellation", hint: "" },
  { id: "conduits", name: "Energy Conduits", hint: "" },
  { id: "spectrogram", name: "Spectrogram", hint: "" },
  { id: "nebula", name: "Nebula Drift", hint: "" },
];

const PERIMETER_ALIASES: Record<string, string> = {
  marquee: "plasma",
  lasers: "plasma",
  prismatic: "rotate",
  electric: "voltage",
  strobe: "voltage",
  embers: "burn",
  aura: "breathe",
  pulse: "breathe",
  shockwave: "breathe",
  glint: "none",
  datastream: "none",
};

/** Maps retired effect ids onto the consolidated set without losing intent. */
export function normalizePerimeter(id: string): string {
  if (PERIMETER_EFFECTS.some((e) => e.id === id)) return id;
  return PERIMETER_ALIASES[id] ?? "none";
}

export function normalizeBody(id: unknown): string {
  return typeof id === "string" && BODY_EFFECTS.some((e) => e.id === id) ? id : "none";
}
