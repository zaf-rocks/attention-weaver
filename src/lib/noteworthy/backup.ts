/**
 * Local data safety.
 *
 * Everything here is LOCAL ONLY — browser localStorage plus files the user
 * downloads and picks themselves. Nothing is uploaded anywhere.
 */

import { readSpacesBundle, writeSpacesBundle } from "./spaces";

export const MAIN_KEY = "noteworthy.v1";
export const UTILITY_KEY = "noteworthy.utility.v1";
export const SNAPSHOT_KEY = "noteworthy.recovery.v1";
export const LAST_BACKUP_KEY = "noteworthy.lastBackupAt";
export const HUB_KEY = "noteworthy.hub.v1";
export const BOARD_KEY = "noteworthy.board.v1";

export const BACKUP_KIND = "noteworthy.backup";
export const BACKUP_FORMAT = 1;

export type BackupFile = {
  kind: typeof BACKUP_KIND;
  backupFormat: number;
  app: string;
  exportedAt: string;
  main: unknown;
  utility: unknown;
  hub?: unknown;
  board?: unknown;
  spaces?: unknown;
};

export type Snapshot = {
  takenAt: string;
  reason: string;
  main: unknown;
  utility: unknown;
  hub?: unknown;
  board?: unknown;
  spaces?: unknown;
};

export type ValidationResult =
  | { ok: true; backup: BackupFile }
  | { ok: false; error: string };

export type BackupSummary = {
  exportedAt: string;
  facets: number;
  tasks: number;
  reminders: number;
  tabs: number;
  clips: number;
};

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

export function buildBackup(
  main: unknown,
  utility: unknown,
  at = new Date(),
  hub: unknown = null,
  board: unknown = null,
): BackupFile {
  return {
    kind: BACKUP_KIND,
    backupFormat: BACKUP_FORMAT,
    app: "Noteworthy",
    exportedAt: at.toISOString(),
    main,
    utility,
    hub,
    board,
  };
}

/** Strict, non-destructive validation. Anything unexpected is rejected with a plain message. */
export function validateBackup(raw: unknown): ValidationResult {
  if (!isObject(raw)) return { ok: false, error: "That file isn't a Noteworthy backup." };
  if (raw.kind !== BACKUP_KIND) {
    return { ok: false, error: "That file isn't a Noteworthy backup." };
  }
  if (typeof raw.backupFormat !== "number") {
    return { ok: false, error: "This backup is missing its format version." };
  }
  if (raw.backupFormat > BACKUP_FORMAT) {
    return {
      ok: false,
      error: "This backup was made by a newer version of Noteworthy. Nothing was changed.",
    };
  }
  if (typeof raw.exportedAt !== "string" || Number.isNaN(Date.parse(raw.exportedAt))) {
    return { ok: false, error: "This backup has no readable export date." };
  }
  if (!isObject(raw.main) || !isObject((raw.main as Record<string, unknown>).facets)) {
    return { ok: false, error: "This backup has no readable field data." };
  }
  if (!isObject(raw.utility) && !isObject(raw.hub)) {
    return { ok: false, error: "This backup has no readable repository data." };
  }
  return {
    ok: true,
    backup: {
      kind: BACKUP_KIND,
      backupFormat: raw.backupFormat,
      app: typeof raw.app === "string" ? raw.app : "Noteworthy",
      exportedAt: raw.exportedAt,
      main: raw.main,
      utility: isObject(raw.utility) ? raw.utility : {},
      hub: isObject(raw.hub) ? raw.hub : null,
      board: isObject(raw.board) ? raw.board : null,
      spaces: isObject(raw.spaces) ? raw.spaces : null,
    },
  };
}

/** Human-readable preview shown before anything is replaced. */
export function summarize(backup: BackupFile): BackupSummary {
  const main = isObject(backup.main) ? backup.main : {};
  const facetsRaw = isObject(main.facets) ? main.facets : {};
  const facets = Object.values(facetsRaw);
  let tasks = 0;
  let reminders = 0;
  for (const f of facets) {
    if (!isObject(f)) continue;
    if (Array.isArray(f.tasks)) {
      for (const t of f.tasks) {
        tasks += 1;
        if (isObject(t) && Array.isArray(t.subtasks)) tasks += t.subtasks.length;
      }
    }
    if (Array.isArray(f.reminders)) reminders += f.reminders.length;
  }
  const util = isObject(backup.utility) ? backup.utility : {};
  return {
    exportedAt: backup.exportedAt,
    facets: facets.length,
    tasks,
    reminders,
    tabs: Array.isArray(util.tabs) ? util.tabs.length : 0,
    clips:
      (Array.isArray(util.clips) ? util.clips.length : 0) +
      (isObject(backup.hub) && Array.isArray(backup.hub.entries) ? backup.hub.entries.length : 0),
  };
}

export function backupFilename(at = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `noteworthy-backup-${at.getFullYear()}-${p(at.getMonth() + 1)}-${p(at.getDate())}-${p(
    at.getHours(),
  )}${p(at.getMinutes())}.json`;
}

/* ------------------------- browser-side operations ------------------------- */

const readKey = (key: string): unknown => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export function currentBackup(): BackupFile {
  return {
    ...buildBackup(readKey(MAIN_KEY), readKey(UTILITY_KEY), new Date(), readKey(HUB_KEY), readKey(BOARD_KEY)),
    spaces: readSpacesBundle(),
  };
}

export function downloadBackup(): string {
  const backup = currentBackup();
  const name = backupFilename(new Date(backup.exportedAt));
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  window.localStorage.setItem(LAST_BACKUP_KEY, backup.exportedAt);
  return name;
}

/** Always called before anything destructive. */
export function takeSnapshot(reason: string): Snapshot {
  const snap: Snapshot = {
    takenAt: new Date().toISOString(),
    reason,
    main: readKey(MAIN_KEY),
    utility: readKey(UTILITY_KEY),
    hub: readKey(HUB_KEY),
    board: readKey(BOARD_KEY),
    spaces: readSpacesBundle(),
  };
  try {
    window.localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snap));
  } catch {
    /* storage full — the caller still gets the in-memory snapshot */
  }
  return snap;
}

export function readSnapshot(): Snapshot | null {
  const raw = readKey(SNAPSHOT_KEY);
  if (!isObject(raw) || typeof raw.takenAt !== "string") return null;
  return {
    takenAt: raw.takenAt,
    reason: typeof raw.reason === "string" ? raw.reason : "unknown",
    main: raw.main ?? null,
    utility: raw.utility ?? null,
    hub: raw.hub ?? null,
    board: raw.board ?? null,
    spaces: raw.spaces ?? null,
  };
}

/** Replace local state from a validated backup, after snapshotting the current one. */
export function applyBackup(backup: BackupFile) {
  takeSnapshot("before import");
  window.localStorage.setItem(MAIN_KEY, JSON.stringify(backup.main));
  window.localStorage.setItem(UTILITY_KEY, JSON.stringify(backup.utility));
  if (backup.hub) window.localStorage.setItem(HUB_KEY, JSON.stringify(backup.hub));
  if (backup.board) window.localStorage.setItem(BOARD_KEY, JSON.stringify(backup.board));
  if (backup.spaces) writeSpacesBundle(backup.spaces);
}

export function restoreSnapshot(snap: Snapshot) {
  if (snap.main !== null) window.localStorage.setItem(MAIN_KEY, JSON.stringify(snap.main));
  if (snap.utility !== null) window.localStorage.setItem(UTILITY_KEY, JSON.stringify(snap.utility));
  if (snap.hub) window.localStorage.setItem(HUB_KEY, JSON.stringify(snap.hub));
  if (snap.board) window.localStorage.setItem(BOARD_KEY, JSON.stringify(snap.board));
  if (snap.spaces) writeSpacesBundle(snap.spaces);
}

export function lastBackupAt(): string | null {
  try {
    return window.localStorage.getItem(LAST_BACKUP_KEY);
  } catch {
    return null;
  }
}
