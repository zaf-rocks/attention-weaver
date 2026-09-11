# Next Phase — Visual Fidelity + Motion Polish (V1A baseline continues)

The spatial geometry, exact-100 weight engine, seven-notch control, shared-element selection, utility facets, and persistence are built and validated. Per the build-priority order, the next milestone is step 7: visual fidelity, imagery, depth, gradients, and effects — plus three small hardening items left open from the weight work.

## Part 1 — Hardening (verify-first, small)

- **Field breathing check** — confirm with a live phone-size check that changing a notch actually resizes the tapped facet on the field after the overlay closes (the one behavior not yet browser-verified). If it doesn't visibly change, fix the sizing path before the visual pass.
- **Reduced Motion selection** — add the alternative selection transition: same departure-from-source and centered landing on the Information face, but with a short cross-fade/scale instead of repeated 540° rotation. Driven by `prefers-reduced-motion`.
- **Migration drift test** — add a Vitest case loading a persisted state whose weights drifted from its notches, asserting content survives and the total renormalizes to exactly 1000.

## Part 2 — Visual fidelity pass (match the main reference silhouette)

Target: near-black deep-space cockpit framing where a three-second glance reveals what matters through shape and prominence.


| Area               | Work                                                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Field framing      | Near-black background with a subtle nebula visible only between objects; atmospheric separation per band.                       |
| Panel construction | Substantial beveled physical panels — layered glass/metal depth, convincing shadows and restrained reflections.                 |
| Perimeters         | Ultra-thin energetic perimeter lines (not thick neon), using each facet's two-endpoint perimeter gradient.                      |
| Interiors          | Dark, restrained interiors — strong color lives in edges, highlights, typography, imagery, reflections, not giant fills.        |
| Imagery            | Imagery/center marks become a major visual component per facet; seeded choices per spectral family.                             |
| Typography         | Sophisticated futuristic type: tighter tracking, luminous titles, legible taglines.                                             |
| Gradients          | Body + perimeter gradients both two-endpoint, complementary, shifting ultra-slowly; body changes never overwrite perimeter.     |
| Effects            | Polish the reusable field/perimeter effects (breathing glow, chasing lights, etc.) to restrained intensity with speed controls. |


## Part 3 — Validation before claiming completion

1. Vitest full pass, including the new drift test.
2. Playwright at 9:16 phone size: field breathing on notch change, source-origin selection, centering/containment in all three states, no page scroll, no console errors.
3. Reduced Motion mode verified in the browser (emulated media).
4. Fidelity test: three-second glance on the rendered field shows hierarchy through relative size and prominence.

No new skins, no facet add/delete, no backend changes.