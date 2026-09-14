import { useMemo, useState } from "react";
import type { FieldSettings } from "@/lib/noteworthy/types";
import { FIELD_EFFECTS } from "@/lib/noteworthy/effects";
import {
  applyBackup,
  downloadBackup,
  lastBackupAt,
  readSnapshot,
  restoreSnapshot,
  summarize,
  validateBackup,
  type BackupFile,
  type Snapshot,
} from "@/lib/noteworthy/backup";
import { EffectPicker, Slider } from "./EffectPicker";

const readableDate = (value: string | null) => {
  if (!value) return "Not yet";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString();
};

export function DataSafetyPanel({
  savedAt,
  settings,
  onSettings,
  onReload,
  onReset,
  onClose,
}: {
  savedAt: string | null;
  settings: FieldSettings;
  onSettings: (patch: Partial<FieldSettings>) => void;
  onReload: () => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const [pending, setPending] = useState<BackupFile | null>(null);
  const [recovery, setRecovery] = useState<Snapshot | null>(() => readSnapshot());
  const [confirmRecovery, setConfirmRecovery] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [backupAt, setBackupAt] = useState<string | null>(() => lastBackupAt());
  const [message, setMessage] = useState<string | null>(null);
  const summary = useMemo(() => (pending ? summarize(pending) : null), [pending]);

  const chooseImport = async (file: File | undefined) => {
    setPending(null);
    setMessage(null);
    if (!file) return;
    try {
      const checked = validateBackup(JSON.parse(await file.text()));
      if (!checked.ok) {
        setMessage(`${checked.error} Your current information was not changed.`);
        return;
      }
      setPending(checked.backup);
    } catch {
      setMessage("That file could not be read as JSON. Your current information was not changed.");
    }
  };

  const confirmImport = () => {
    if (!pending) return;
    applyBackup(pending);
    onReload();
    setRecovery(readSnapshot());
    setPending(null);
    setMessage("Backup imported. The information shown now is stored locally on this device.");
  };

  const confirmRestore = () => {
    if (!recovery) return;
    restoreSnapshot(recovery);
    onReload();
    setRecovery(readSnapshot());
    setConfirmRecovery(false);
    setMessage(
      "Recovery restored. The state from immediately before this restore is now the recovery point.",
    );
  };

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-[oklch(0.04_0.02_270/0.82)] p-3">
      <section
        className="nw-facet flex max-h-[94dvh] w-full max-w-[480px] flex-col"
        style={
          {
            ["--body-a" as string]: "#10182b",
            ["--body-b" as string]: "#080b16",
            ["--per-a" as string]: "#5ef2ff",
            ["--per-b" as string]: "#c04bff",
            ["--glow" as string]: 0.45,
          } as React.CSSProperties
        }
        aria-label="Field and data controls"
      >
        <header className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="nw-label">Noteworthy</p>
            <h2 className="font-display text-lg font-semibold">Field &amp; data</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close field and data controls"
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card/70"
          >
            ✕
          </button>
        </header>

        <div className="nw-scroll flex-1 space-y-5 px-4 py-4">
          <section className="space-y-3">
            <div>
              <h3 className="font-display text-sm font-semibold tracking-wide">Data safety</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Entries autosave in this browser on this device. GitHub protects the app code—not
                your entries. Download a backup regularly and keep it somewhere you trust.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-xl border border-border/60 bg-black/20 p-3 text-[11px]">
              <div>
                <span className="nw-label">Saved locally</span>
                <p className="mt-1">{readableDate(savedAt)}</p>
              </div>
              <div>
                <span className="nw-label">Last backup</span>
                <p className="mt-1">{readableDate(backupAt)}</p>
              </div>
            </div>

            <button
              type="button"
              data-testid="nw-export-backup"
              className="w-full rounded-lg border border-primary/60 bg-primary/15 py-2.5 text-xs tracking-[0.15em] uppercase hover:bg-primary/25"
              onClick={() => {
                downloadBackup();
                const stamp = lastBackupAt();
                setBackupAt(stamp);
                setMessage(
                  "Backup downloaded. Keep the JSON file in a safe folder or cloud drive.",
                );
              }}
            >
              Export backup
            </button>

            <label className="block cursor-pointer rounded-lg border border-border bg-card/50 py-2.5 text-center text-xs tracking-[0.15em] uppercase hover:bg-accent/20">
              Choose backup to import
              <input
                type="file"
                accept="application/json,.json"
                className="sr-only"
                data-testid="nw-import-file"
                onChange={(event) => void chooseImport(event.target.files?.[0])}
              />
            </label>

            {summary && (
              <div className="rounded-xl border border-primary/50 bg-primary/10 p-3 text-xs">
                <p className="font-semibold">Review before import</p>
                <p className="mt-1 text-muted-foreground">
                  Exported {readableDate(summary.exportedAt)} · {summary.facets} facets ·{" "}
                  {summary.tasks} tasks · {summary.reminders} reminders · {summary.tabs} tabs ·{" "}
                  {summary.clips} clips
                </p>
                <p className="mt-2 text-muted-foreground">
                  Importing replaces the current local information. Noteworthy will first preserve
                  the current state as a recovery point.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPending(null)}
                    className="flex-1 rounded-lg border border-border py-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    data-testid="nw-confirm-import"
                    onClick={confirmImport}
                    className="flex-1 rounded-lg border border-primary/60 bg-primary/20 py-2"
                  >
                    Confirm import
                  </button>
                </div>
              </div>
            )}

            {recovery && !confirmRecovery && (
              <button
                type="button"
                onClick={() => setConfirmRecovery(true)}
                className="w-full rounded-lg border border-border py-2.5 text-xs tracking-[0.12em] uppercase"
              >
                Restore last recovery · {readableDate(recovery.takenAt)}
              </button>
            )}

            {confirmRecovery && recovery && (
              <div className="rounded-xl border border-amber-400/50 bg-amber-400/10 p-3 text-xs">
                Restore the recovery saved before “{recovery.reason}”? Your current state will be
                preserved as the next recovery point.
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmRecovery(false)}
                    className="flex-1 rounded-lg border border-border py-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    data-testid="nw-confirm-recovery"
                    onClick={confirmRestore}
                    className="flex-1 rounded-lg border border-amber-400/60 py-2"
                  >
                    Restore
                  </button>
                </div>
              </div>
            )}

            {message && (
              <p
                role="status"
                className="rounded-lg border border-border/60 bg-black/20 p-2 text-xs"
              >
                {message}
              </p>
            )}
          </section>

          <section className="space-y-3 border-t border-border/60 pt-4">
            <h3 className="font-display text-sm font-semibold tracking-wide">Field preferences</h3>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[var(--primary)]"
                checked={settings.reducedMotion}
                onChange={(event) => onSettings({ reducedMotion: event.target.checked })}
              />
              Reduced motion
            </label>
            <Slider
              label="Ambient motion"
              value={settings.ambientMotion}
              onChange={(value) => onSettings({ ambientMotion: value })}
              suffix="%"
            />
            <Slider
              label="Depth intensity"
              value={settings.depth}
              onChange={(value) => onSettings({ depth: value })}
              suffix="%"
            />
            <EffectPicker
              label="Field effect"
              options={FIELD_EFFECTS}
              value={settings.fieldEffect}
              onChange={(value) => onSettings({ fieldEffect: value })}
            />
          </section>

          <section className="border-t border-border/60 pt-4">
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="w-full rounded-lg border border-destructive/60 py-2.5 text-xs tracking-[0.15em] text-destructive uppercase"
              >
                Reset field
              </button>
            ) : (
              <div className="rounded-xl border border-destructive/60 bg-destructive/10 p-3 text-xs">
                Reset all facet content and field preferences? A recovery point will be created
                first. Repository and capture entries will remain unchanged.
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="flex-1 rounded-lg border border-border py-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    data-testid="nw-confirm-reset"
                    onClick={() => {
                      onReset();
                      onClose();
                    }}
                    className="flex-1 rounded-lg border border-destructive/70 py-2 text-destructive"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
