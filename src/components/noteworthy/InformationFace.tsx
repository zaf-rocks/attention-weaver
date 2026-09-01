import { useState } from "react";
import type { Facet, Reminder, Task } from "@/lib/noteworthy/types";
import { POSITION_NAMES } from "@/lib/noteworthy/initial";
import { SizeNotchControl } from "./SizeNotchControl";

const uid = () => Math.random().toString(36).slice(2, 9);

export function InformationFace({
  facet,
  positionLabel,
  onPatch,
  onWeight,
  onClose,
  onCustomize,
  onSettings,
}: {
  facet: Facet;
  positionLabel: string;
  onPatch: (patch: Partial<Facet>) => void;
  onWeight: (tenths: number) => void;
  onClose: () => void;
  onCustomize: () => void;
  onSettings: () => void;
}) {
  const [newTask, setNewTask] = useState("");

  const patchTask = (id: string, patch: Partial<Task>) =>
    onPatch({ tasks: facet.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) });

  const addReminder = () =>
    onPatch({
      reminders: [...facet.reminders, { id: uid(), at: "", label: "Reminder" } as Reminder].slice(
        0,
        3,
      ),
    });

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-start gap-2 border-b border-border/60 px-3 py-2">
        <div className="min-w-0 flex-1">
          <span className="nw-label">{positionLabel || POSITION_NAMES[facet.id]}</span>
          <input
            className="nw-input mt-1 font-display text-base font-semibold"
            value={facet.title}
            onChange={(e) => onPatch({ title: e.target.value })}
            aria-label="Facet title"
          />
        </div>
        <button
          onClick={onClose}
          aria-label="Return to field"
          className="mt-4 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border bg-card/70 text-sm hover:bg-accent/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          ✕
        </button>
      </header>

      <div className="nw-scroll flex-1 space-y-3 px-3 py-3">
        <input
          className="nw-input"
          value={facet.tagline}
          onChange={(e) => onPatch({ tagline: e.target.value })}
          placeholder="Tagline"
          aria-label="Tagline"
        />

        <div>
          <span className="nw-label">Overview</span>
          <textarea
            className="nw-input mt-1 min-h-[64px] resize-none"
            value={facet.overview}
            onChange={(e) => onPatch({ overview: e.target.value })}
            aria-label="Overview"
          />
        </div>

        {/* Weight */}
        <div className="rounded-xl border border-border/60 bg-card/40 p-2.5">
          <Slider
            label={`Attention weight — ${toPct(facet.weight)}%`}
            value={facet.weight}
            min={MIN_WEIGHT}
            max={MAX_WEIGHT}
            step={5}
            onChange={onWeight}
          />
          <label className="mt-2 flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={facet.locked}
              onChange={(e) => onPatch({ locked: e.target.checked })}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            Lock weight (excluded from redistribution)
          </label>
        </div>

        {/* Tasks */}
        <div>
          <span className="nw-label">Tasks</span>
          <ul className="mt-1 space-y-1">
            {facet.tasks.map((t) => (
              <li key={t.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={(e) => patchTask(t.id, { done: e.target.checked })}
                  className="h-4 w-4 shrink-0 accent-[var(--primary)]"
                  aria-label={`Complete ${t.text}`}
                />
                <input
                  className={`nw-input ${t.done ? "line-through opacity-60" : ""}`}
                  value={t.text}
                  onChange={(e) => patchTask(t.id, { text: e.target.value })}
                  aria-label="Task text"
                />
                <button
                  className="shrink-0 px-1 text-muted-foreground hover:text-destructive"
                  aria-label="Delete task"
                  onClick={() => onPatch({ tasks: facet.tasks.filter((x) => x.id !== t.id) })}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <form
            className="mt-1.5 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!newTask.trim()) return;
              onPatch({ tasks: [...facet.tasks, { id: uid(), text: newTask.trim(), done: false }] });
              setNewTask("");
            }}
          >
            <input
              className="nw-input"
              placeholder="Add task"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              aria-label="New task"
            />
            <button className="shrink-0 rounded-lg border border-border px-3 text-sm hover:bg-accent/30">
              +
            </button>
          </form>
        </div>

        {/* Notes */}
        <div>
          <span className="nw-label">Notes</span>
          <textarea
            className="nw-input mt-1 min-h-[54px] resize-none"
            value={facet.notes}
            onChange={(e) => onPatch({ notes: e.target.value })}
            aria-label="Notes"
          />
        </div>

        {/* Timing */}
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="nw-label">Due</span>
            <input
              type="datetime-local"
              className="nw-input mt-1"
              value={facet.due}
              onChange={(e) => onPatch({ due: e.target.value })}
              aria-label="Due date and time"
            />
          </label>
          <label className="block">
            <span className="nw-label">Position name</span>
            <input
              className="nw-input mt-1"
              value={positionLabel}
              onChange={(e) => onPatch({ notes: facet.notes })}
              readOnly
              aria-label="Spatial position"
            />
          </label>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span className="nw-label">Reminders</span>
            {facet.reminders.length < 3 && (
              <button
                className="text-[11px] text-primary hover:underline"
                onClick={addReminder}
                type="button"
              >
                + add
              </button>
            )}
          </div>
          <ul className="mt-1 space-y-1">
            {facet.reminders.map((r) => (
              <li key={r.id} className="flex gap-2">
                <input
                  type="datetime-local"
                  className="nw-input"
                  value={r.at}
                  onChange={(e) =>
                    onPatch({
                      reminders: facet.reminders.map((x) =>
                        x.id === r.id ? { ...x, at: e.target.value } : x,
                      ),
                    })
                  }
                  aria-label="Reminder time"
                />
                <button
                  className="shrink-0 px-1 text-muted-foreground hover:text-destructive"
                  aria-label="Delete reminder"
                  onClick={() =>
                    onPatch({ reminders: facet.reminders.filter((x) => x.id !== r.id) })
                  }
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          {facet.reminders.length > 0 && (
            <p className="mt-1 text-[10px] text-muted-foreground">
              Prototype: reminders are stored locally — no system notifications are sent.
            </p>
          )}
        </div>

        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={facet.complete}
            onChange={(e) => onPatch({ complete: e.target.checked })}
            className="h-4 w-4 accent-[var(--primary)]"
          />
          Facet complete
        </label>

        <p className="text-[10px] text-muted-foreground">
          Last accessed {new Date(facet.lastAccessed).toLocaleString()}
        </p>
      </div>

      <footer className="flex gap-2 border-t border-border/60 px-3 py-2">
        <button
          onClick={onCustomize}
          className="flex-1 rounded-lg border border-border bg-card/60 py-2 text-xs tracking-[0.16em] uppercase hover:bg-accent/25"
        >
          Customize
        </button>
        <button
          onClick={onSettings}
          className="flex-1 rounded-lg border border-border bg-card/60 py-2 text-xs tracking-[0.16em] uppercase hover:bg-accent/25"
        >
          Settings
        </button>
      </footer>
    </div>
  );
}
