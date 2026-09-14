# Noteworthy roadmap

## Pass 1 — Data safety + fixed-field migration (current)
- [ ] Backup module: build/validate/summarize, dated filename, snapshot + restore
- [ ] Data Safety panel reachable from the field (export, import w/ preview + confirm, restore last recovery, saved-locally + last-backup timestamps)
- [ ] Remove all user-facing Weight/size UI (notch control, locks, percentages, notices)
- [ ] Remove runtime weight coupling from field layout; fixed geometry constants only
- [ ] Information face migration: position name, title, single description, tasks + subtasks, notes, last accessed + due, unlimited reminders, complete, one Customize, Save and Continue
- [ ] Tests: backup validation, state migration, round trip
- [ ] Validate portrait containment, persistence, no weight UI, build/type/test health

## Deferred (explicitly out of this pass)
- Cloud/auth/sync
- Utility restructuring (A–K tabs, composer, 12 post-it boards)
- New visual skin / landscape redesign / animation choreography
