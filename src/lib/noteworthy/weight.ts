import type { Facet, SlotId } from "./types";

/**
 * Weight engine.
 * All weights are stored as INTEGER TENTHS OF A PERCENT.
 * The 15 primary facets always sum to exactly 1000 (= 100.0%).
 * Utility bars are excluded entirely.
 */
export const TOTAL = 1000;
export const MIN_WEIGHT = 5; // 0.5%
export const MAX_WEIGHT = 700; // 70.0%

export const toPct = (tenths: number) => (tenths / 10).toFixed(1);

export const primaryIds = (facets: Record<SlotId, Facet>): SlotId[] =>
  (Object.keys(facets) as SlotId[]).filter((id) => !facets[id].utility);

export function sumPrimary(facets: Record<SlotId, Facet>): number {
  return primaryIds(facets).reduce((s, id) => s + facets[id].weight, 0);
}

/**
 * Set `targetId` to `desired` tenths, redistributing the delta across
 * eligible (unlocked, non-target, non-utility) facets proportionally to
 * their current weight, respecting MIN_WEIGHT floors. Soft-stops when no
 * further legal redistribution exists. Always returns a set summing to 1000.
 */
export function setWeight(
  facets: Record<SlotId, Facet>,
  targetId: SlotId,
  desired: number,
): Record<SlotId, Facet> {
  const ids = primaryIds(facets);
  if (!ids.includes(targetId) || facets[targetId].locked) return facets;

  const others = ids.filter((id) => id !== targetId && !facets[id].locked);
  const lockedSum = ids
    .filter((id) => id !== targetId && facets[id].locked)
    .reduce((s, id) => s + facets[id].weight, 0);

  const pool = TOTAL - lockedSum; // shared between target + others
  const minOthers = others.length * MIN_WEIGHT;

  // Legal bounds for the target given locks (soft-stop).
  const maxTarget = Math.min(MAX_WEIGHT, pool - minOthers);
  const minTarget = MIN_WEIGHT;
  if (maxTarget < minTarget) return facets;

  const target = Math.max(minTarget, Math.min(maxTarget, Math.round(desired)));
  const remaining = pool - target;

  const current = others.map((id) => facets[id].weight);
  const currentSum = current.reduce((s, v) => s + v, 0);

  // Proportional allocation with floors, then deterministic remainder fix.
  let allocated: number[] = others.map((_, i) =>
    currentSum > 0
      ? Math.max(MIN_WEIGHT, Math.floor((current[i] / currentSum) * remaining))
      : Math.max(MIN_WEIGHT, Math.floor(remaining / others.length)),
  );

  let diff = remaining - allocated.reduce((s, v) => s + v, 0);
  // Distribute leftover (or claw back) deterministically, largest-first.
  const order = others
    .map((id, i) => ({ i, w: current[i], id }))
    .sort((a, b) => b.w - a.w || (a.id < b.id ? -1 : 1))
    .map((o) => o.i);

  let guard = 0;
  while (diff !== 0 && guard < 10000) {
    let moved = false;
    for (const i of order) {
      if (diff === 0) break;
      if (diff > 0) {
        allocated[i] += 1;
        diff -= 1;
        moved = true;
      } else if (allocated[i] > MIN_WEIGHT) {
        allocated[i] -= 1;
        diff += 1;
        moved = true;
      }
    }
    if (!moved) break;
    guard += 1;
  }

  const next = { ...facets };
  next[targetId] = { ...facets[targetId], weight: target + (diff !== 0 ? diff : 0) };
  others.forEach((id, i) => {
    next[id] = { ...facets[id], weight: allocated[i] };
  });

  return next;
}

export function assertTotal(facets: Record<SlotId, Facet>): boolean {
  return sumPrimary(facets) === TOTAL;
}
