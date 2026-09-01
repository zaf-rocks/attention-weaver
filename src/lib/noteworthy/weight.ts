import type { Facet, SlotId } from "./types";

/**
 * Weight / Size engine — seven-notch doctrine.
 *
 * Internally weight is stored as INTEGER TENTHS OF A PERCENT.
 * The 15 primary facets always sum to exactly 1000 (= 100.0%).
 * Utility bars are excluded entirely.
 *
 * Users never see percentages. They move a discrete seven-notch control
 * (-3 .. Recommended .. +3). Each notch is 10 attention points, i.e. 100 tenths.
 */
export const TOTAL = 1000;
export const MIN_WEIGHT = 5; // 0.5% floor
export const NOTCH_STEP = 100; // 10 attention points, expressed in tenths
export const MIN_NOTCH = -3;
export const MAX_NOTCH = 3;

export type Notch = -3 | -2 | -1 | 0 | 1 | 2 | 3;

/** Hidden per-position initialization geometry. Sums to exactly 1000. */
export const RECOMMENDED: Record<SlotId, number> = {
  UTIL_TOP: 0,
  TFL: 35,
  TL: 50,
  TC: 70,
  TR: 50,
  TFR: 35,
  UL: 90,
  LL: 90,
  C: 160,
  UR: 90,
  LR: 90,
  BFL: 35,
  BL: 50,
  BC: 70,
  BR: 50,
  BFR: 35,
  UTIL_BOTTOM: 0,
};

/** Deterministic iteration order for remainder allocation. */
export const SLOT_ORDER: SlotId[] = [
  "TFL",
  "TL",
  "TC",
  "TR",
  "TFR",
  "UL",
  "LL",
  "C",
  "UR",
  "LR",
  "BFL",
  "BL",
  "BC",
  "BR",
  "BFR",
];

export const NOTCH_LABELS: Record<number, string> = {
  [-3]: "Much smaller",
  [-2]: "Smaller",
  [-1]: "Slightly smaller",
  0: "Recommended",
  1: "Slightly larger",
  2: "Larger",
  3: "Much larger",
};

export const clampNotch = (n: number): Notch =>
  Math.max(MIN_NOTCH, Math.min(MAX_NOTCH, Math.round(n))) as Notch;

export const primaryIds = (facets: Record<SlotId, Facet>): SlotId[] =>
  SLOT_ORDER.filter((id) => facets[id] && !facets[id].utility);

export function sumPrimary(facets: Record<SlotId, Facet>): number {
  return primaryIds(facets).reduce((s, id) => s + facets[id].weight, 0);
}

export function assertTotal(facets: Record<SlotId, Facet>): boolean {
  return sumPrimary(facets) === TOTAL;
}

/** Unlocked, non-utility facets other than the target: the only legal donors/recipients. */
export function eligibleIds(facets: Record<SlotId, Facet>, targetId: SlotId): SlotId[] {
  return primaryIds(facets).filter((id) => id !== targetId && !facets[id].locked);
}

/** Total tenths donors can legally release before hitting their floors. */
function donorCapacity(facets: Record<SlotId, Facet>, ids: SlotId[]): number {
  return ids.reduce((s, id) => s + Math.max(0, facets[id].weight - MIN_WEIGHT), 0);
}

/** Move `amount` tenths out of (sign -1) or into (sign +1) the donors, evenly. */
function spread(
  weights: Record<SlotId, number>,
  ids: SlotId[],
  amount: number,
  sign: 1 | -1,
): number {
  let rem = amount;
  let guard = 0;
  while (rem > 0 && guard < 10000) {
    guard += 1;
    const active =
      sign === -1 ? ids.filter((id) => (weights[id] ?? 0) > MIN_WEIGHT) : ids.slice();
    if (active.length === 0) break;
    const per = Math.max(1, Math.floor(rem / active.length));
    for (const id of active) {
      if (rem === 0) break;
      const current = weights[id] ?? 0;
      const step =
        sign === -1 ? Math.min(per, current - MIN_WEIGHT, rem) : Math.min(per, rem);
      if (step <= 0) continue;
      weights[id] = current + sign * step;
      rem -= step;
    }
  }
  return amount - rem; // actually moved
}

export type NotchResult = {
  facets: Record<SlotId, Facet>;
  notch: Notch;
  changed: boolean;
  reason?: "locked" | "no-donors" | "soft-stop" | "none";
};

/**
 * Set `targetId` to the requested notch, taking from / giving to eligible
 * unlocked facets evenly and deterministically. Soft-stops at the largest
 * fully-satisfiable notch. The primary total always stays exactly 1000.
 */
export function setNotch(
  facets: Record<SlotId, Facet>,
  targetId: SlotId,
  requested: number,
): NotchResult {
  const target = facets[targetId];
  const currentNotch = clampNotch(target?.notch ?? 0);
  if (!target || target.utility) {
    return { facets, notch: currentNotch, changed: false, reason: "locked" };
  }
  if (target.locked) {
    return { facets, notch: currentNotch, changed: false, reason: "locked" };
  }

  const want = clampNotch(requested);
  if (want === currentNotch) {
    return { facets, notch: currentNotch, changed: false, reason: "none" };
  }

  const donors = eligibleIds(facets, targetId);
  if (donors.length === 0) {
    return { facets, notch: currentNotch, changed: false, reason: "no-donors" };
  }

  const dir = want > currentNotch ? 1 : -1;
  const weights: Record<SlotId, number> = {} as Record<SlotId, number>;
  for (const id of primaryIds(facets)) weights[id] = facets[id].weight;

  // Walk one notch at a time so a partially-fundable request soft-stops on a notch.
  let landed = currentNotch;
  let softStopped = false;
  for (let n = currentNotch + dir; dir > 0 ? n <= want : n >= want; n += dir) {
    const delta = NOTCH_STEP; // tenths for this single notch
    if (dir > 0) {
      if (donorCapacity(facets, donors) === 0 && false) break;
      const capacity = donors.reduce(
        (s, id) => s + Math.max(0, (weights[id] ?? 0) - MIN_WEIGHT),
        0,
      );
      if (capacity < delta) {
        softStopped = true;
        break;
      }
      const moved = spread(weights, donors, delta, -1);
      if (moved < delta) {
        // Undo partial move — never land between notches.
        spread(weights, donors, moved, 1);
        softStopped = true;
        break;
      }
      weights[targetId] = (weights[targetId] ?? 0) + delta;
    } else {
      if ((weights[targetId] ?? 0) - delta < MIN_WEIGHT) {
        softStopped = true;
        break;
      }
      weights[targetId] = (weights[targetId] ?? 0) - delta;
      spread(weights, donors, delta, 1);
    }
    landed = n as Notch;
  }

  if (landed === currentNotch) {
    return { facets, notch: currentNotch, changed: false, reason: "soft-stop" };
  }

  const next = { ...facets };
  for (const id of primaryIds(facets)) {
    next[id] = { ...facets[id], weight: weights[id] ?? facets[id].weight };
  }
  next[targetId] = { ...next[targetId], notch: landed as Notch };

  return {
    facets: next,
    notch: landed as Notch,
    changed: true,
    reason: softStopped ? "soft-stop" : undefined,
  };
}

/**
 * Rebuild an exact, legal set of weights from stored notches — used on load so
 * drifted or legacy persisted data can never poison the field.
 */
export function normalizeFromNotches(facets: Record<SlotId, Facet>): Record<SlotId, Facet> {
  const ids = primaryIds(facets);
  let out = { ...facets };
  for (const id of ids) {
    out[id] = { ...out[id], weight: RECOMMENDED[id], notch: clampNotch(out[id].notch ?? 0) };
  }
  // Re-apply each non-zero notch through the engine, ignoring locks during rebuild.
  const unlockedView = { ...out } as Record<SlotId, Facet>;
  for (const id of ids) unlockedView[id] = { ...unlockedView[id], locked: false, notch: 0 };

  let working = unlockedView;
  for (const id of ids) {
    const n = clampNotch(out[id].notch ?? 0);
    if (n === 0) continue;
    working = setNotch(working, id, n).facets;
  }

  out = { ...out };
  for (const id of ids) {
    out[id] = { ...out[id], weight: working[id].weight, notch: clampNotch(working[id].notch ?? 0) };
  }

  // Final safety: force the exact total.
  const drift = TOTAL - ids.reduce((s, id) => s + out[id].weight, 0);
  if (drift !== 0) {
    const anchor = ids[0]!;
    out[anchor] = { ...out[anchor], weight: Math.max(MIN_WEIGHT, out[anchor].weight + drift) };
  }
  return out;
}
