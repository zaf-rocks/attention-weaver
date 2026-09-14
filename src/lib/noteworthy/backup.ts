/**
 * Local data safety.
 *
 * Everything here is LOCAL ONLY — browser localStorage plus files the user
 * downloads and picks themselves. Nothing is uploaded anywhere.
 */

export const MAIN_KEY = "noteworthy.v1";
export const UTILITY_KEY = "noteworthy.utility.v1";
export const SNAPSHOT_KEY = "noteworthy.recovery.v1";
export const LAST_BACKUP_KEY = "noteworthy.lastBackupAt";

export const BACKUP_KIND = "noteworthy.backup";
export const BACKUP_FORMAT = 1;

export type BackupFile = {
  kind: typeof BACKUP_KIND;
  backupFormat: number;
  app: string;
  exportedAt: string;
  main: unknown;
  utility: unknown;
};

export type Snapshot = {
  takenAt: string;
  reason: string;
  main: unknown;
  utility: unknown;
};

export type ValidationResult = { ok: true; backup: BackupFile } | { ok: false; error: string };

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

const valueAt = (record: Record<string, unknown>, key: string): unknown => record[key];

function hasReadableMain(main: unknown): boolean {
  if (!isObject(main)) return false;
  const facets = valueAt(main, "facets");
  if (!isObject(facets)) return false;
  const entries = Object.values(facets);
  return (
    entries.length >= 15 &&
    entries.every(
      (facet) =>
        isObject(facet) &&
        typeof valueAt(facet, "title") === "string" &&
        Array.isArray(valueAt(facet, "tasks")),
    )
  );
}

function hasReadableUtility(utility: unknown): boolean {
  if (!isObject(utility)) return false;
  const tabs = valueAt(utility, "tabs");
  const clips = valueAt(utility, "clips");
  const draft = valueAt(utility, "draft");
  return (
    Array.isArray(tabs) &&
    tabs.length > 0 &&
    Array.isArray(clips) &&
    isObject(draft) &&
    typeof valueAt(draft, "text") === "string"
  );
}

export function buildBackup(main: unknown, utility: unknown, at = new Date()): BackupFile {
  return {
    kind: BACKUP_KIND,
    backupFormat: BACKUP_FORMAT,
    app: "Noteworthy",
    exportedAt: at.toISOString(),
    main,
    utility,
  };
}

/** Strict, non-destructive validation. Anything unexpected is rejected with a plain message. */
export function validateBackup(raw: unknown): ValidationResult {
  if (!isObject(raw)) return { ok: false, error: "That file isn't a Noteworthy backup." };
  if (valueAt(raw, "kind") !== BACKUP_KIND) {
    return { ok: false, error: "That file isn't a Noteworthy backup." };
  }
  const backupFormat = valueAt(raw, "backupFormat");
  if (typeof backupFormat !== "number") {
    return { ok: false, error: "This backup is missing its format version." };
  }
  if (backupFormat > BACKUP_FORMAT) {
    return {
      ok: false,
      error: "This backup was made by a newer version of Noteworthy. Nothing was changed.",
    };
  }
  const exportedAt = valueAt(raw, "exportedAt");
  if (typeof exportedAt !== "string" || Number.isNaN(Date.parse(exportedAt))) {
    return { ok: false, error: "This backup has no readable export date." };
  }
  const main = valueAt(raw, "main");
  if (!hasReadableMain(main)) {
    return { ok: false, error: "This backup has incomplete or unreadable field data." };
  }
  const utility = valueAt(raw, "utility");
  if (!hasReadableUtility(utility)) {
    return { ok: false, error: "This backup has incomplete or unreadable repository data." };
  }
  return {
    ok: true,
    backup: {
      kind: BACKUP_KIND,
      backupFormat,
      app: typeof valueAt(raw, "app") === "string" ? (valueAt(raw, "app") as string) : "Noteworthy",
      exportedAt,
      main,
      utility,
    },
  };
}

/** Human-readable preview shown before anything is replaced. */
export function summarize(backup: BackupFile): BackupSummary {
  const main = isObject(backup.main) ? backup.main : {};
  const rawFacets = valueAt(main, "facets");
  const facetsRaw = isObject(rawFacets) ? rawFacets : {};
  const facets = Object.values(facetsRaw);
  let tasks = 0;
  let reminders = 0;
  const countTasks = (items: unknown[]): number =>
    items.reduce<number>((total, task) => {
      if (!isObject(task)) return total;
      const children = valueAt(task, "subtasks");
      return total + 1 + (Array.isArray(children) ? countTasks(children) : 0);
    }, 0);
  for (const f of facets) {
    if (!isObject(f)) continue;
    const facetTasks = valueAt(f, "tasks");
    const facetReminders = valueAt(f, "reminders");
    if (Array.isArray(facetTasks)) tasks += countTasks(facetTasks);
    if (Array.isArray(facetReminders)) reminders += facetReminders.length;
  }
  const util = isObject(backup.utility) ? backup.utility : {};
  const tabs = valueAt(util, "tabs");
  const clips = valueAt(util, "clips");
  return {
    exportedAt: backup.exportedAt,
    facets: facets.length,
    tasks,
    reminders,
    tabs: Array.isArray(tabs) ? tabs.length : 0,
    clips: Array.isArray(clips) ? clips.length : 0,
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
  return buildBackup(readKey(MAIN_KEY), readKey(UTILITY_KEY));
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
  if (!isObject(raw) || typeof valueAt(raw, "takenAt") !== "string") return null;
  const takenAt = valueAt(raw, "takenAt") as string;
  const reason = valueAt(raw, "reason");
  return {
    takenAt,
    reason: typeof reason === "string" ? reason : "unknown",
    main: valueAt(raw, "main") ?? null,
    utility: valueAt(raw, "utility") ?? null,
  };
}

/** Replace local state from a validated backup, after snapshotting the current one. */
export function applyBackup(backup: BackupFile) {
  takeSnapshot("before import");
  window.localStorage.setItem(MAIN_KEY, JSON.stringify(backup.main));
  window.localStorage.setItem(UTILITY_KEY, JSON.stringify(backup.utility));
}

export function restoreSnapshot(snap: Snapshot) {
  // Preserve the current state as the new recovery point before replacing it.
  takeSnapshot("before recovery restore");
  if (snap.main === null) window.localStorage.removeItem(MAIN_KEY);
  else window.localStorage.setItem(MAIN_KEY, JSON.stringify(snap.main));
  if (snap.utility === null) window.localStorage.removeItem(UTILITY_KEY);
  else window.localStorage.setItem(UTILITY_KEY, JSON.stringify(snap.utility));
}

export function lastBackupAt(): string | null {
  try {
    return window.localStorage.getItem(LAST_BACKUP_KEY);
  } catch {
    return null;
  }
}
