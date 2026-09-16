# Noteworthy — Utility Facet Pass

The field, its 15 fixed-size facets and the two utility bars all stay exactly as they are. This pass finishes the half-done size-removal work so the app runs again, then rebuilds the two utility workspaces.

## Current state (verified)

The project is mid-change and will not run right now: the data model has already dropped size/weight, but the field screen, the selection overlay and the old size control still reference it (`src/routes/index.tsx`, `FacetOverlay.tsx`, `SizeNotchControl.tsx`, `weight.ts`). Nothing can be tested until that is closed out.

The selection animation constant is already 540 degrees; no change needed there.

## Stage A — make it run again (must come first)

- Field screen sizes itself from the fixed geometry constants instead of the old size values; hierarchy unchanged (center dominant, four adjacent, top/bottom centers, then outer, then far outer).
- Remove the size control, locks, percentages and redistribution notices everywhere, and delete the now-unused size engine and its tests.
- Selection overlay keeps its stage / carrier / rotator structure and the 540-degree reveal; its separate "Settings" face folds into the single Customize face.
- Finish the Data Safety panel already started: export a dated backup of both field and repository data, import with validation and a confirmation preview, automatic recovery snapshot before anything destructive, honest "saved locally" and "last backup" times.

## Stage B — upper utility: repository + notebook hub

One workspace that owns both the repository and the notebook, opened from the upper bar using the existing expansion motion.

- Primary tabs A–K, each with its own colour and an editable label; the letter identity is permanent.
- Entries inside a tab are numbered in order and renumber visibly when reordered, so A1 / C4 / K12 always identify one entry.
- Existing repository entries are carried over into lettered tabs once, never duplicated on later launches, never seeded over.
- Notebook/composer lives here as a resizable rich-text area with autosave and recoverable history.
- Tapping the dead centre of the compact bar opens an inline quick-entry field: autosaves while typing, and on submit appends as the next numbered entry in Tab A. An active draft is never silently overwritten.
- Copy, reuse, and user-triggered external handoffs stay as they are, still honest about what a browser can do.
- Visible Customize control and an obvious return-to-field control.

## Stage C — lower utility: corkboard

The lower bar opens into a full-screen corkboard, replacing the old capture dock behaviour.

- Twelve persistent Post-it notes, distinct colours, subtle depth, readable type.
- Each has an editable title and body; add, edit, delete, archive, undo/confirm; persists across refresh.
- Any note can be converted into a checklist. The original text is preserved as a recovery copy, never destroyed.
- Checklist rows: add, edit, remove, check, uncheck; completed rows stay struck through.
- Tapping the dead centre of the compact lower bar opens a quick-entry field that autosaves into a "Save for Later" note, with the destination shown and changeable.
- Its own Customize settings, kept separate from the upper hub's settings, plus a return-to-field control.
- Legacy notebook content is not silently converted into Post-its; it stays in the upper hub.

## Stage D — responsive + verification

- Portrait and landscape, phone and desktop: field fills the viewport with no page scroll, no overlap, hierarchy intact; both workspaces stay inside the viewport.
- Browser-tested: upper centre capture into a numbered Tab A entry, refresh persistence, lower centre capture into the Save for Later note, note editing, note-to-list conversion and recovery, all list row actions, Customize and return-to-field in both workspaces, 15 fixed facets unchanged.
- Automated tests for backup validation, state migration and tab/entry numbering; type and build check clean.

## Out of scope this pass

Cloud, accounts or sync; new skins; colour/field effect work; cockpit controls; publishing or branch merges.

## Technical notes

- New: `utility-hub` state (A–K tabs with stable letter ids, ordered entries, composer draft + history) and `corkboard` state (12 notes, colour, title, body, optional list rows, archived flag, recovery copy), each persisted under its own versioned localStorage key with a one-time non-duplicating migration from `noteworthy.utility.v1`.
- Rework `RepositoryBar` / `RepositoryWorkspace` and replace `CaptureBar` / `CaptureWorkspace` with corkboard components; both keep using `UtilityStage` and the existing transform doctrine.
- Field geometry comes from `src/lib/noteworthy/layout.ts` only; `weight.ts`, `weight.test.ts` and `SizeNotchControl.tsx` are deleted.
