import type { SlotId } from "./types";

/**
 * FIXED FIELD GEOMETRY.
 *
 * The original 16 / 9 / 7 / 5 / 3.5 model was construction scaffolding used to
 * establish the correct silhouette. It survives here ONLY as immutable layout
 * constants. There is no user-facing weight, notch, lock or redistribution:
 * the hierarchy is fixed and identical on every launch.
 */
export const PROMINENCE: Record<SlotId, number> = {
  UTIL_TOP: 0,
  TFL: 3.5,
  TL: 5,
  TC: 7,
  TR: 5,
  TFR: 3.5,
  UL: 9,
  LL: 9,
  C: 16,
  UR: 9,
  LR: 9,
  BFL: 3.5,
  BL: 5,
  BC: 7,
  BR: 5,
  BFR: 3.5,
  UTIL_BOTTOM: 0,
};

/** Horizontal share within a band. The exponent keeps 16 dramatically larger than 3.5. */
export const growOf = (id: SlotId) => Math.pow(PROMINENCE[id], 0.8);

/** Row-relative height for the upper/lower bands, as a percentage of the band. */
export const heightOf = (id: SlotId, bandMax: number) =>
  58 + 42 * Math.pow(PROMINENCE[id] / bandMax, 0.7);

/** Front-face information density tier, derived from fixed prominence only. */
export const tierOf = (id: SlotId): "xl" | "lg" | "md" | "sm" => {
  const p = PROMINENCE[id];
  if (p >= 13) return "xl";
  if (p >= 8) return "lg";
  if (p >= 6) return "md";
  return p >= 4.5 ? "md" : "sm";
};

export const UPPER_BAND: SlotId[] = ["TFL", "TL", "TC", "TR", "TFR"];
export const LOWER_BAND: SlotId[] = ["BFL", "BL", "BC", "BR", "BFR"];

export const bandMax = (ids: SlotId[]) => Math.max(...ids.map((id) => PROMINENCE[id]));

/** Center band column shares — each side facet keeps its own individual geometry. */
export const CENTER_GROW = growOf("C") * 1.15;
export const SIDE_GROW = growOf("UL") * 0.62;
