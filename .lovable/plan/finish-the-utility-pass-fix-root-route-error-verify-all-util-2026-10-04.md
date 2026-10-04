# Finish the utility pass: fix root-route error + verify all utility flows

## Background
The upper repository hub and lower corkboard code is complete, but its browser
verification was interrupted. Separately, the routine package update
(@tanstack/react-start 1.168.60 / react-router 1.170.41 / router-plugin
1.168.42) introduced one TypeScript error in `src/routes/__root.tsx`.

## Step 1 — Fix the root-route type error
`errorComponent` in `src/routes/__root.tsx` now requires a lazy component
shape. Wrap the existing `ErrorComponent` (or convert it to the expected
`lazy()` form) so `bunx tsgo --noEmit` passes again. No behavior change.

## Step 2 — Browser-verify the utility flows (the unfinished work)
Drive the running app with Playwright at phone viewport (505x965) and verify:

Upper hub:
- Tap the middle capture zone → inline quick-entry field appears
- Type (debounced autosave) → submit → text lands as next numbered entry in Tab A
- A1-style code lookup inside the field
- Autosaved content survives refresh

Lower corkboard:
- Tap middle capture zone → quick-thought field → saves into the designated Post-it
- Open corkboard: 12 colored notes visible
- Edit note title/text; convert a note to a list (original text preserved as recovery)
- List rows: add / edit / remove / check / uncheck
- Customize access in both workspaces; return-to-field works in both

Field:
- All 17 facets render, fixed hierarchy intact, no Weight controls, no page scroll

## Step 3 — Portrait + landscape containment
Repeat containment checks at landscape viewport; the new workspaces must fit
corner-to-corner with no overlap or scroll.

## Step 4 — Health checks
- `bunx tsgo --noEmit` clean
- Build log shows "build OK"
- No console errors during all of the above

## Not in this pass
Cloud/auth, new skins, animation changes, cockpit controls.
