import { describe, expect, it } from "vitest";
import { createInitialState } from "./initial";
import { createInitialUtilityState } from "./utility-initial";
import {
  BACKUP_FORMAT,
  BACKUP_KIND,
  backupFilename,
  buildBackup,
  summarize,
  validateBackup,
} from "./backup";

describe("Noteworthy backup files", () => {
  it("round-trips a complete backup through JSON and validation", () => {
    const source = buildBackup(
      createInitialState(),
      createInitialUtilityState(),
      new Date("2026-09-14T12:34:00.000Z"),
    );
    const checked = validateBackup(JSON.parse(JSON.stringify(source)));

    expect(checked.ok).toBe(true);
    if (!checked.ok) return;
    expect(checked.backup.kind).toBe(BACKUP_KIND);
    expect(checked.backup.backupFormat).toBe(BACKUP_FORMAT);
    expect(checked.backup.main).toEqual(source.main);
    expect(checked.backup.utility).toEqual(source.utility);
  });

  it("rejects malformed and future-format files without producing a backup", () => {
    expect(validateBackup({ nope: true })).toEqual({
      ok: false,
      error: "That file isn't a Noteworthy backup.",
    });

    const future = buildBackup(createInitialState(), createInitialUtilityState());
    future.backupFormat = BACKUP_FORMAT + 1;
    const checked = validateBackup(future);
    expect(checked.ok).toBe(false);
    if (!checked.ok) expect(checked.error).toContain("newer version");
  });

  it("rejects incomplete field or repository content", () => {
    const backup = buildBackup(createInitialState(), createInitialUtilityState());
    expect(validateBackup({ ...backup, main: { facets: {} } }).ok).toBe(false);
    expect(validateBackup({ ...backup, utility: { tabs: [], clips: [] } }).ok).toBe(false);
  });

  it("summarizes the material the user is about to import", () => {
    const backup = buildBackup(createInitialState(), createInitialUtilityState());
    const summary = summarize(backup);

    expect(summary.facets).toBe(17);
    expect(summary.tasks).toBe(34);
    expect(summary.tabs).toBe(10);
    expect(summary.clips).toBe(1);
  });

  it("uses a dated, recognizable filename", () => {
    expect(backupFilename(new Date(2026, 8, 14, 7, 5))).toBe(
      "noteworthy-backup-2026-09-14-0705.json",
    );
  });
});
