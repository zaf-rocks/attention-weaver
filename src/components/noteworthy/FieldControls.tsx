import { useEffect, useRef, useState } from "react";
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
} from "@/lib/noteworthy/backup";
import { EffectPicker, Slider } from "./EffectPicker";

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : "never");

/** Global field settings + local Data Safety. Nothing here leaves this device. */
export function FieldControls({
  settings,
  savedAt,
  onSettings,
  onReset,
  onReloaded,
  onClose,
}: {
  settings: FieldSettings;
  savedAt: string | null;
  onSettings: (patch: Partial<FieldSettings>) => void;
  onReset: () => void;
  onReloaded: () => void;
  onClose: () => void;
}) {
  const [backupAt, setBackupAt] = useState<string | null>(null);
  const [pending, setPending] = useState<BackupFile | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [snapAt, setSnapAt] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);

  const refresh = () => {
    setBackupAt(lastBackupAt());
    setSnapAt(readSnapshot()?.takenAt ?? null);
  };
  useEffect(refresh, []);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  const summary = pending ? summarize(pending) : null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-3" data-testid="nw-field-controls">
      <div className="absolute inset-0 bg-[oklch(0.05_0.02_270/0.7)]" onClick={onClose} />
      <div className="nw-facet relative flex max-h-full w-full max-w-[420px] flex-col">
        <header className="flex items-center gap-2 border-b border-border/60 px-3 py-2">
          <h2 className="font-display text-[12px] font-semibold tracking-[0.16em] uppercase">
            Field & Data Safety
          </h2>
          <button
            onClick={onClose}
            aria-label="Return to field"
            className="ml-auto grid h-8 w-8 place-items-center rounded-full border border-border bg-card/70 text-sm"
          >
            ✕
          </button>
        </header>

        <div className="nw-scroll relative z-[3] flex-1 space-y-4 px-3 py-3">
          <section className="space-y-2">
            <span className="nw-label">Data safety — stored on this device only</span>
            <p className="text-[11px] text-muted-foreground">
              Saved locally: {fmt(savedAt)}
              <br />
              Last backup: {fmt(backupAt)}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                data-testid="nw-export"
                className="rounded-lg border border-primary/60 bg-primary/15 px-3 py-1.5 text-[11px]"
                onClick={() => {
                  const name = downloadBackup();
                  setMessage(`Downloaded ${name}.`);
                  refresh();
                }}
              >
                Export all data
              </button>
              <button
                className="rounded-lg border border-border px-3 py-1.5 text-[11px]"
                onClick={() => file.current?.click()}
              >
                Import backup…
              </button>
              <input
                ref={file}
                type="file"
                accept="application/json,.json"
                className="hidden"
                data-testid="nw-import-file"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  try {
                    const result = validateBackup(JSON.parse(await f.text()));
                    if (result.ok) {
                      setPending(result.backup);
                      setMessage(null);
                    } else setMessage(result.error);
                  } catch {
                    setMessage("That file couldn't be read as a Noteworthy backup. Nothing was changed.");
                  }
                }}
              />
              {snapAt && (
                <button
                  className="rounded-lg border border-border px-3 py-1.5 text-[11px]"
                  onClick={() => {
                    const snap = readSnapshot();
                    if (!snap) return;
                    if (!window.confirm(`Restore the recovery copy from ${fmt(snap.takenAt)}?`)) return;
                    restoreSnapshot(snap);
                    onReloaded();
                    setMessage("Recovery copy restored.");
                  }}
                >
                  Restore last recovery
                </button>
              )}
            </div>

            {summary && pending && (
              <div className="rounded-lg border border-primary/50 p-2 text-[11px]" data-testid="nw-import-preview">
                <p>
                  Backup from {fmt(summary.exportedAt)}: {summary.facets} facets, {summary.tasks} tasks,{" "}
                  {summary.reminders} reminders, {summary.clips} repository entries.
                </p>
                <p className="mt-1 text-muted-foreground">
                  Your current data will be kept as a recovery copy first.
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    data-testid="nw-import-confirm"
                    className="rounded-md border border-primary/60 bg-primary/15 px-2 py-1"
                    onClick={() => {
                      applyBackup(pending);
                      setPending(null);
                      onReloaded();
                      refresh();
                      setMessage("Backup imported.");
                    }}
                  >
                    Replace with this backup
                  </button>
                  <button className="rounded-md border border-border px-2 py-1" onClick={() => setPending(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {message && (
              <p aria-live="polite" className="text-[11px] text-primary">
                {message}
              </p>
            )}
          </section>

          <section className="space-y-2">
            <span className="nw-label">Field</span>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[var(--primary)]"
                checked={settings.reducedMotion}
                onChange={(e) => onSettings({ reducedMotion: e.target.checked })}
              />
              Reduced motion
            </label>
            <Slider
              label="Ambient motion"
              value={settings.ambientMotion}
              onChange={(v) => onSettings({ ambientMotion: v })}
              suffix="%"
            />
            <Slider
              label="Depth intensity"
              value={settings.depth}
              onChange={(v) => onSettings({ depth: v })}
              suffix="%"
            />
            <EffectPicker
              label="Field effect"
              options={FIELD_EFFECTS}
              value={settings.fieldEffect}
              onChange={(v) => onSettings({ fieldEffect: v })}
            />
            <button
              onClick={() => {
                if (window.confirm("Reset the field? A recovery copy is kept first.")) {
                  onReset();
                  refresh();
                }
              }}
              className="w-full rounded-lg border border-destructive/60 py-2 text-xs tracking-widest text-destructive uppercase"
            >
              Reset field
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
