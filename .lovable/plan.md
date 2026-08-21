# Noteworthy V1A — Forensic Audit and Repair Plan

Audit performed by reading the repository at commit 4fe0711. No code was changed, and no rendered/device validation was performed — every claim below is traced to source, and anything requiring a live device check is labelled as such.

## 1. What V1A genuinely gets right

- Clean modular separation: `src/lib/noteworthy/{types,initial,weight,store,effects}.ts` vs presentation in `src/components/noteworthy/*`. Data survives visual changes.
- Weight stored as integer tenths (`weight: 160` = 16.0%), with utility bars flagged `utility: true` and excluded from `primaryIds()` (`src/lib/noteworthy/weight.ts:15`).
- Locked default distribution is exactly correct: 160 + 4×90 + 2×70 + 4×50 + 4×35 = 1000 (`src/lib/noteworthy/initial.ts`). Center 16.0, center-adjacent 9.0, top/bottom center 7.0, inner outer 5.0, far outer 3.5.
- Five-band structure exists in the right order with thin full-width utility bars top and bottom (`src/routes/index.tsx:105-152`), inside one `100dvh` non-scrolling main.
- Fronts are clean: title, tagline, mark, open-task count, compact due date — no percentages, no internal codes (`FacetFront.tsx`).
- Position labels shown to the user are full natural language via `POSITION_NAMES` (`initial.ts:3`).
- Independent two-endpoint body and perimeter gradients that cannot overwrite each other (`CustomizeFace.tsx`), plus a reusable perimeter/field effect catalog.
- Information face content coverage is close to spec (title, tagline, overview, tasks CRUD, notes, due, up to 3 reminders, completion, last accessed, Customize/Settings, corner ×), and it is honest about reminders being local-only.
- localStorage persistence with field-merge against a fresh baseline so new fields never come back undefined (`store.ts:8`).

## 2. Confirmed defects and deviations

### Selection / transform architecture
1. `FacetOverlay.tsx:48` renders a fixed centered panel that scales up from 0.55 (`.nw-spinner` keyframe `nw-540`, `styles.css:564`). There is no captured source `DOMRect` and no carrier layer, so the facet does not depart from its real field location — this is exactly the forbidden "centered overlay that merely scales from nowhere".
2. The 540° entrance is applied to the same element that positions and scales the object, and it is `forwards`, so a permanent `rotateY(540deg)` stays on the outer node for the whole session.
3. The inner rotator (`FacetOverlay.tsx:50-54`) then applies `rotateY(180deg → 360deg)` **inside** that permanently rotated `preserve-3d` parent. Rotation is therefore composed on the stage/carrier, violating "move the object to center once, then rotate the object; never rotate the stage carrying it."
4. `.nw-spinner-flip` (`styles.css:577`) is dead CSS — nothing uses it, so the reduced-motion override for face changes never applies. Reduced motion only replaces the entrance; the inner 180° transition still runs.
5. Overlay sizing uses `h-[86%]` of `fixed inset-0` (layout viewport), with no `dvh` or safe-area handling, and `perspective-origin: 50% 45%`.

### Weight engine
6. `MAX_WEIGHT = 700` (`weight.ts:11`) is the arbitrary cap Project Knowledge forbids; the legal maximum must be derived from locks and other facets' floors only.
7. Slider `step={5}` (`InformationFace.tsx:81`) is 0.5% precision; spec requires 0.1% (step 1 tenth).
8. `Slider` prints raw `value` (`EffectPicker.tsx:52`), so the weight control shows "160" next to a label reading "16.0%". Raw tenths leak into the UI.
9. Remainder handling is wrong: `weight.ts:90` dumps any leftover `diff` onto the target (`target + diff`), which can push the target outside its own legal bounds and silently defeats the soft-stop. Floors are applied with `Math.max(MIN_WEIGHT, Math.floor(...))` before reconciliation, so over-allocation is possible and then charged back to the target.
10. `assertTotal()` exists but is never called anywhere; there are no tests for locks, floors, all-others-locked, repeated changes, or persistence.
11. `store.ts` `load()` validates only `version`. Stored facet weights are merged verbatim — a corrupted or hand-edited total (e.g. 998) is accepted and never renormalised.
12. Utility bars expose meaningless Weight UI: `FacetOverlay` renders `InformationFace` for every facet, and `InformationFace` has no `facet.utility` guard, so the two bars show a weight slider (value 0, min 5) and a lock checkbox.
13. Locking is a plain `onPatch({ locked })` with no revalidation, so a user can lock facets until the remaining pool cannot satisfy floors; `setWeight` then silently returns unchanged with no feedback.

### Geometry
14. The four center-adjacent facets are averaged into one shared column width: `sideGrow = share((UL+LL+UR+LR)/2) * 0.62` used for **both** side columns (`index.tsx:86-88, 124, 131`), so left and right are always identical regardless of individual weights.
15. Within each column, `UL`/`LL` (and `UR`/`LR`) are hard-coded `flex: 1 1 0` — a forced 50/50 split. Neither pair responds to its own Weight, directly contradicting "each of the four must respond to its own Weight".
16. `scaleFor()` (`index.tsx:56`) uses hard-coded tenths thresholds, so typography tiers jump arbitrarily once weights redistribute away from defaults.
17. Layout constants (`share` exponent 0.8, `heightPct` 58+42, 1.15 / 0.62 multipliers, band flex 5/21/40/21/5) are inline literals in the route rather than CSS variables, so the composition cannot be tuned against the 9:16 reference without editing the engine.

### Faces / content
18. The position-name field is `readOnly` with a no-op `onChange` that writes `notes` back to itself (`InformationFace.tsx:169-175`). Editable position labels are unimplemented, and the no-op patch is a latent bug.
19. Settings (global field behaviour) and Customize share one back face and are both reached from Information, but the Information→Customize/Settings rotation angle is hard-coded (`180`/`360` inline) rather than modular/configurable.
20. Customize has no image/upload/AI-suggest affordance — marks only — and no direction/intensity controls beyond glow/speed/motion.

## 3. Root cause — the mobile 3D "drops below the viewport" bug

Two independent causes stack:

**Cause A — rotation on the carrier, with perspective.** `.nw-spinner` is 86% of viewport height (a very tall plane) and carries a permanent 3D `rotateY`. Its child adds another `rotateY` inside `preserve-3d`, so the face is projected through `perspective: 1400px` from an origin at `50% 45%` — above the element's own centre. Under perspective projection, a tall plane rotated in 3D about an origin that is not its own centre is displaced and magnified along the axis away from the origin: the bottom of the panel swings toward the viewer, projects larger, and lands below the viewport edge. Because the entrance animation is `forwards` and the inner rotator adds another 180° when entering Customize/Settings, the composed rotation is not the identity — so the displacement is not transient: it persists for as long as that state is open. This matches the reported symptom precisely (dip during entrance, permanent offset after entering Customize/Settings).

**Cause B — viewport units.** The overlay measures against `fixed inset-0` (layout viewport) with no `100dvh`, `svh`, or `env(safe-area-inset-*)`. On mobile with a visible URL bar the layout viewport is taller than the visual viewport, so even an unrotated 86%-tall panel already overhangs the bottom, and the × control can leave the screen.

Verdict on the doctrine: **yes, the current architecture violates it.** Positioning, entrance scaling, entrance rotation, and face rotation are collapsed onto two nested nodes rather than four distinct layers (fixed stage → carrier → object rotator → faces), and the permanent entrance rotation is stacked on the positioning node.

Note: the analysis above is derived from the source and the CSS transform/perspective model. I have not yet reproduced it on a device or in a headless browser; step 0 of the plan below is that reproduction.

## 4. Weight-engine verdict

Correct: integer-tenths storage, utility exclusion, proportional withdrawal/release, deterministic largest-first remainder ordering, soft-stop concept, correct 1000-sum defaults.

Incorrect: arbitrary 700 cap; 0.5% step; raw tenths shown as if percent; leftover remainder charged to the target instead of reconciled among eligible facets; `assertTotal` unused; no stored-state validation or renormalisation; no lock/floor feedback; utility bars exposed to weight UI; zero tests.

## 5. Repair vs rebuild

**Repair, with one surgical replacement.** The data model, weight engine skeleton, persistence, effect catalog, and all three faces are sound and worth keeping. Only the selection/transform layer (`FacetOverlay` + its CSS) is architecturally wrong and should be rewritten from scratch as a four-layer shared-element system. The center-band geometry is a contained arithmetic fix inside the route. A V1B challenger is not justified.

## 6. Phased plan (structure before polish)

**Phase 0 — Reproduce and instrument.** Headless 9:16 run: capture the selected facet's bounding rect at entrance start/mid/end and after entering Customize and Settings; assert containment within the visual viewport. Establishes the failing baseline before any fix.

**Phase 1 — Transform architecture rewrite.** Replace `FacetOverlay` internals with four layers: (1) fixed non-rotating stage sized in `dvh` with safe-area padding; (2) carrier that captures the tapped tile's `DOMRect` via FLIP and animates it to a fixed centred target, then becomes inert with no rotation ever applied; (3) object rotator that owns the 540° entrance and all later face rotations about its own centre, with the entrance rotation normalised (mod 360) once it settles so face rotations start from a clean base; (4) face layers. `perspective-origin` moves to the object's own centre. Rotation angles become configurable constants. Re-run Phase 0 assertions until the centre and bounds are invariant across every state.

**Phase 2 — Weight-engine correctness.** Remove `MAX_WEIGHT`; derive max from `1000 − lockedSum − (eligible × floor)`. Slider step 1 tenth; display via `toPct`. Reconcile the remainder among eligible facets only, never the target. Hide weight/lock UI for utility facets. Add a unit test suite (locks, floors, all-others-locked, repeated up/down cycles, exact 1000 invariant) and call `assertTotal` in dev.

**Phase 3 — Persistence validation.** Validate and migrate stored state on load: shape check, clamp, renormalise primaries to exactly 1000, preserve locks, fall back to baseline only if unrecoverable.

**Phase 4 — Individual geometry.** Give each side column its own width from `UL+LL` and `UR+LR` respectively, and give each facet within a column a flex share from its own weight (no 50/50). Move all layout constants to CSS variables. Derive typography tier from weight rank rather than fixed thresholds. Verify the five-band silhouette holds at extremes (one facet near max, others at floor).

**Phase 5 — Face completeness.** Editable position label (remove the no-op patch), modular Information→Customize→Settings angle, image/icon selection beyond marks.

**Phase 6 — Visual fidelity.** Only now: beveled panel depth, image-led interiors, ultra-thin luminous spectral edges, nebula only between objects, ultra-slow gradient drift, restrained float/parallax against the 9:16 reference.

## 7. Things worth flagging that may not have been noticed

- The `readOnly` position field's `onChange` writes `notes` back to itself — a live no-op patch that also refreshes state unnecessarily.
- `.nw-spinner-flip` is dead CSS; the reduced-motion path for face changes is therefore not wired at all.
- `touchFacet` on every open mutates `lastAccessed`, which writes the whole state to localStorage on every tap — fine now, but it means "last accessed" changes even on an accidental tap.
- The `.nw-recede` treatment applies `blur(3px)` to every other tile simultaneously; on mobile GPUs this is the most likely source of frame drops during the entrance and may be contributing to the perceived jump.
- Weight seeds encode presentation-order assumptions in `SEEDS`; if a facet is ever added, the 1000 total silently breaks with no guard.
- Reminders are capped at 3 by `.slice(0,3)` after appending, which silently drops the newest rather than blocking the add.
