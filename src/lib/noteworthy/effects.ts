export type EffectOption = { id: string; name: string };

/** Perimeter effects — concise UI names. */
export const PERIMETER_EFFECTS: EffectOption[] = [
  { id: "none", name: "Inert" },
  { id: "prismatic", name: "Prism Bleed" },
  { id: "nodes", name: "Node Flash" },
  { id: "marquee", name: "Marquee Chase" },
  { id: "glitch", name: "Edge Glitch" },
  { id: "aura", name: "Aura Lift" },
  { id: "datastream", name: "Data Runes" },
  { id: "shockwave", name: "Shockwave" },
  { id: "glint", name: "Shoulder Glint" },
  { id: "burn", name: "Anodized Burn" },
  { id: "breathe", name: "Breathing Glow" },
  { id: "pulse", name: "Pulse" },
  { id: "electric", name: "Live Current" },
  { id: "embers", name: "Ember Edge" },
  { id: "lasers", name: "Chasing Lasers" },
  { id: "strobe", name: "Strobe" },
  { id: "rotate", name: "Color Rotation" },
];

/** Field (background) effects. */
export const FIELD_EFFECTS: EffectOption[] = [
  { id: "none", name: "Void" },
  { id: "gridscan", name: "Grid Scan" },
  { id: "constellation", name: "Constellation" },
  { id: "conduits", name: "Energy Conduits" },
  { id: "spectrogram", name: "Spectrogram" },
  { id: "nebula", name: "Nebula Drift" },
];
