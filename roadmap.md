# Noteworthy roadmap

## Pass 1 — Data safety + fixed-field migration (current)

- [x] Backup module: build/validate/summarize, dated filename, snapshot + restore
- [x] Data Safety panel reachable from the field (export, import w/ preview + confirm, restore last recovery, saved-locally + last-backup timestamps)
- [x] Remove all user-facing Weight/size UI (notch control, locks, percentages, notices)
- [x] Remove runtime weight coupling from field layout; fixed geometry constants only
- [x] Information face migration: position name, title, single description, tasks + subtasks, notes, last accessed + due, unlimited reminders, complete, one Customize, Save and Continue
- [x] Tests: backup validation, state migration, round trip
- [x] Build, typecheck, lint and server-render smoke test
- [ ] Final portrait interaction/containment check on the deployed branch preview

## Deferred (explicitly out of this pass)

- Cloud/auth/sync
- Utility restructuring (A–K tabs, composer, 12 post-it boards)
- New visual skin / landscape redesign / animation choreography
