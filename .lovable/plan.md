# Weight/Size Doctrine Update — Seven-Notch Attention Control (spec only)

Recorded as the canonical Weight/Size doctrine. Nothing is implemented until you explicitly authorize code changes.

## Understanding

- The skin stays fixed at 15 weighted facets + 2 utility facets. No add/delete.
- The original defaults (16 / 9×4 / 7×2 / 5×4 / 3.5×4 = 100) survive only as hidden per-position **Recommended baselines**, used for initialization and as the notch-0 anchor.
- Percentages disappear from the entire user interface. They remain internal math only.
- The per-facet control becomes a discrete 7-notch Size/Attention selector: -3 -2 -1 · Recommended · +1 +2 +3, snapping to notches, labeled Smaller / Recommended / Larger.
- Each notch = 10 internal attention points (1.0 percentage point equivalents in today's tenths units → 100 tenths per notch) relative to that facet's Recommended baseline.
- Raising a facet withdraws evenly and deterministically from eligible unlocked facets; lowering releases evenly back to them.
- Locks default **ON** for every facet. A locked facet cannot be adjusted, donate, or receive.
- Zero eligible donors → no change at all: notch reverts to its previous valid value, total untouched, with the message "Unlock at least one other facet to redistribute attention."
- Hidden total stays exactly 100 with integer math; soft-stop when eligible facets hit legal floors/ceilings; no drift.
- Recommended is the per-facet reset; no separate reset button.

## Files that would change

| File | Change |
| --- | --- |
| `src/lib/noteworthy/types.ts` | Add `notch: -3..3` to `Facet`; keep `weight` as the derived internal store; `locked` default true. |
| `src/lib/noteworthy/weight.ts` | Replace `setWeight(desiredTenths)` with `setNotch(facets, id, notch)`. Add `RECOMMENDED` baseline map, `NOTCH_STEP = 100` (tenths), even deterministic donor/recipient math, soft-stop, eligibility check returning a reason. Delete `MAX_WEIGHT`/70% cap and `toPct` from UI use. |
| `src/lib/noteworthy/initial.ts` | Seeds express the baseline table; every facet seeded `locked: true`, `notch: 0`. |
| `src/lib/noteworthy/store.ts` | `setWeight` → `setNotch`; version bump + migration in `load()`. |
| `src/components/noteworthy/InformationFace.tsx` | Replace the percentage `Slider` with the 7-notch control; remove the `%` label; lock toggle wording becomes "Unlock size adjustment"; render the ineligible message. |
| New `src/components/noteworthy/SizeNotchControl.tsx` | Discrete snapping control (7 tick stops, keyboard arrows, ARIA `slider` with text values Smaller 3 … Recommended … Larger 3). |
| `src/routes/index.tsx` | No doctrine change; sizing keeps reading internal weights, so the field still breathes. Verify the `xl/lg/md/sm` thresholds still discriminate at notch extremes. |
| Tests (new) `src/lib/noteworthy/weight.test.ts` | See below. |

## Migration from continuous percentages

1. Bump the persisted state version (`noteworthy.v1` → `v2`) but **migrate rather than discard**, so the current field survives.
2. For each stored facet: `notch = clamp(round((storedWeight - RECOMMENDED[id]) / 100), -3, 3)`.
3. Recompute all 15 weights from notches through the same engine used at runtime, so the loaded field is guaranteed to total exactly 1000 tenths even if the stored data drifted.
4. Any facet whose stored `locked` is absent → `true` (locks default on). Existing explicit unlocks are preserved.
5. All non-weight facet data (title, tagline, overview, tasks, notes, gradients, effects, due/reminders, completion, last accessed) is untouched; utility facets keep `weight: 0` and are excluded entirely.
6. Corrupted/unparseable state falls back to fresh initialization, as today.

## Engine rules (technical)

- Units stay integer tenths internally: total 1000, notch step 100.
- Eligible set = unlocked, non-target, non-utility facets.
- Even distribution: `base = floor(delta / n)`, remainder handed out one tenth at a time in a fixed deterministic order (largest current weight, then slot id) — same tie-break already used, so results are reproducible.
- Floor per facet: `MIN_WEIGHT` (0.5%). Ceiling derives from what donors can legally release — no arbitrary cap.
- Soft-stop: if donors can only cover part of the request, the target moves to the largest notch fully satisfiable; it never lands between notches.
- Post-condition assertion: sum of the 15 primary weights === 1000 after every operation.

## Edge cases and tests

1. All facets locked (default) → tapping any notch is a no-op with the unlock message.
2. Exactly one other facet unlocked → all delta flows to/from it, soft-stopping at its floor.
3. Target locked → control disabled, not merely ignored.
4. Request to +3 when donors can only fund +1 → lands on +1, total exact.
5. -3 on a facet already near floor (e.g. 3.5% baseline) → floor-clamped, releases only what exists.
6. Repeated +1/-1 round trips return every facet to its exact prior weights (reversibility).
7. Remainder distribution with indivisible deltas (e.g. 100 tenths over 7 donors) → total still exactly 1000.
8. Migration: legacy stored weights of 160/90/70/50/35 map to notch 0 across the board.
9. Migration from a drifted/invalid stored total → renormalized to 1000 without losing facet content.
10. Persistence: notch + lock survive reload; utility bars never gain a notch control.
11. Accessibility: keyboard arrows move one notch, Home/End jump to -3/+3, value text is verbal, never numeric percent.
12. No `%` string appears in any facet-facing UI (grep-level test).
