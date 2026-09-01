import { describe, expect, it } from "vitest";
import { createInitialState } from "./initial";
import type { Facet, SlotId } from "./types";
import {
  MIN_WEIGHT,
  NOTCH_STEP,
  RECOMMENDED,
  TOTAL,
  assertTotal,
  normalizeFromNotches,
  primaryIds,
  setNotch,
  sumPrimary,
} from "./weight";

const field = () => createInitialState().facets;

const unlock = (facets: Record<SlotId, Facet>, ids: SlotId[]) => {
  const out = { ...facets };
  for (const id of ids) out[id] = { ...out[id], locked: false };
  return out;
};

const unlockAll = (facets: Record<SlotId, Facet>) => unlock(facets, primaryIds(facets));

describe("seven-notch weight engine", () => {
  it("seeds the recommended baseline summing to exactly 100.0%", () => {
    const f = field();
    expect(sumPrimary(f)).toBe(TOTAL);
    for (const id of primaryIds(f)) {
      expect(f[id].weight).toBe(RECOMMENDED[id]);
      expect(f[id].notch).toBe(0);
      expect(f[id].locked).toBe(true); // locks default ON
    }
  });

  it("is a no-op when every facet is locked", () => {
    const f = field();
    const r = setNotch(f, "C", 1);
    expect(r.changed).toBe(false);
    expect(r.reason).toBe("locked");
    expect(r.notch).toBe(0);
  });

  it("refuses to move when the target is the only unlocked facet", () => {
    const f = unlock(field(), ["C"]);
    const r = setNotch(f, "C", 2);
    expect(r.changed).toBe(false);
    expect(r.reason).toBe("no-donors");
    expect(sumPrimary(r.facets)).toBe(TOTAL);
  });

  it("takes evenly from eligible donors and keeps the exact total", () => {
    const f = unlockAll(field());
    const r = setNotch(f, "C", 1);
    expect(r.changed).toBe(true);
    expect(r.notch).toBe(1);
    expect(r.facets.C.weight).toBe(RECOMMENDED.C + NOTCH_STEP);
    expect(assertTotal(r.facets)).toBe(true);
  });

  it("gives evenly back when decreasing", () => {
    const f = unlockAll(field());
    const r = setNotch(f, "C", -1);
    expect(r.facets.C.weight).toBe(RECOMMENDED.C - NOTCH_STEP);
    expect(assertTotal(r.facets)).toBe(true);
  });

  it("round-trips exactly", () => {
    const f = unlockAll(field());
    const up = setNotch(f, "C", 2).facets;
    const back = setNotch(up, "C", 0).facets;
    expect(assertTotal(back)).toBe(true);
    expect(back.C.weight).toBe(RECOMMENDED.C);
    expect(back.C.notch).toBe(0);
  });

  it("soft-stops on a notch when donors cannot fund the request", () => {
    // Only one small donor available.
    const f = unlock(field(), ["C", "TFL"]);
    const r = setNotch(f, "C", 3);
    expect(r.notch).toBeLessThan(3);
    expect(Number.isInteger(r.notch)).toBe(true);
    expect(assertTotal(r.facets)).toBe(true);
    for (const id of primaryIds(r.facets)) {
      expect(r.facets[id].weight).toBeGreaterThanOrEqual(MIN_WEIGHT);
    }
  });

  it("never lets a decrease push the target below its floor", () => {
    const f = unlockAll(field());
    const r = setNotch(f, "TFL", -3);
    expect(r.facets.TFL.weight).toBeGreaterThanOrEqual(MIN_WEIGHT);
    expect(assertTotal(r.facets)).toBe(true);
  });

  it("leaves locked facets untouched", () => {
    const f = unlock(field(), ["C", "TL", "TR"]);
    const before = { ...f };
    const r = setNotch(f, "C", 1);
    for (const id of primaryIds(f)) {
      if (["C", "TL", "TR"].includes(id)) continue;
      expect(r.facets[id].weight).toBe(before[id].weight);
    }
    expect(assertTotal(r.facets)).toBe(true);
  });

  it("clamps beyond the seven notches", () => {
    const f = unlockAll(field());
    const r = setNotch(f, "C", 9);
    expect(r.notch).toBeLessThanOrEqual(3);
  });

  it("normalizes legacy / drifted state back to an exact total", () => {
    const f = unlockAll(field());
    const drifted = { ...f };
    drifted.C = { ...drifted.C, weight: 999, notch: 1 };
    drifted.TL = { ...drifted.TL, weight: 1, notch: 0 };
    const fixed = normalizeFromNotches(drifted);
    expect(sumPrimary(fixed)).toBe(TOTAL);
    expect(fixed.C.notch).toBe(1);
  });

  it("excludes utility bars entirely", () => {
    const f = field();
    expect(primaryIds(f)).not.toContain("UTIL_TOP");
    expect(f.UTIL_TOP.weight).toBe(0);
  });
});
