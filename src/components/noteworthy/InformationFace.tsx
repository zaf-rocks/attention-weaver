import { useState } from "react";
import type { Facet, Reminder, Task } from "@/lib/noteworthy/types";

const uid = () => Math.random().toString(36).slice(2, 9);

/** Recursively patch a task or subtask by id. */
function patchIn(tasks: Task[], id: string, patch: Partial<Task>): Task[] {
  return tasks.map((t) =>
    t.id === id ? { ...t, ...patch } : { ...t, subtasks: patchIn(t.subtasks, id, patch) },
  );
}
function removeIn(tasks: Task[], id: string): Task[] {
  return tasks
    .filter((t) => t.id !== id)
    .map((t) => ({ ...t, subtasks: removeIn(t.subtasks, id) }));
}
function addSubtaskIn(tasks: Task[], parentId: string, text: string): Task[] {
  return tasks.map((t) =>
    t.id === parentId
      ? { ...t, subtasks: [...t.subtasks, { id: uid(), text, done: false, subtasks: [] }] }
      : { ...t, subtasks: addSubtaskIn(t.subtasks, parentId, text) },
  );
}

export function InformationFace({
  facet,
  onPatch,
  onClose,
  onCustomize,
}: {
  facet: Facet;
  onPatch: (patch: Partial<Facet>) => void;
  onClose: () => void;
  onCustomize: () => void;
}) {
  const [newTask, setNewTask] = useState("");

  const TaskRow = ({ task, depth }: { task: Task; depth: number }) => (
    <li style={{ marginLeft: depth * 14 }}>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={task.done}
          onChange={(e) => onPatch({ tasks: patchIn(facet.tasks, task.id, { done: e.target.checked }) })}
          className="h-4 w-4 shrink-0 accent-[var(--primary)]"
          aria-label={`Complete ${task.text}`}
        />
        <input
          className={`nw-input ${task.done ? "line-through opacity-60" : ""}`}
          value={task.text}
          onChange={(e) => onPatch({ tasks: patchIn(facet.tasks, task.id, { text: e.target.value }) })}
          aria-label="Task text"
        />
        {depth < 2 && (
          <button
            type="button"
            className="shrink-0 px-1 text-muted-foreground hover:text-primary"
            aria-label={`Add subtask to ${task.text}`}
            onClick={() => onPatch({ tasks: addSubtaskIn(facet.tasks, task.id, "New subtask") })}
          >
            ↳
          </button>
        )}
        <button
          type="button"
          className="shrink-0 px-1 text-muted-foreground hover:text-destructive"
          aria-label="Delete task"
          onClick={() => onPatch({ tasks: removeIn(facet.tasks, task.id) })}
        >
          ✕
        </button>
      </div>
      {task.subtasks.length > 0 && (
        <ul className="mt-1 space-y-1">
          {task.subtasks.map((s) => (
            <TaskRow key={s.id} task={s} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-start gap-2 border-b border-border/60 px-3 py-2">
        <div className="min-w-0 flex-1">
          <input
            className="nw-input text-[10px] tracking-[0.18em] text-muted-foreground uppercase"
            value={facet.positionName}
            onChange={(e) => onPatch({ positionName: e.target.value })}
            aria-label="Position name"
          />
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
        <div>
          <span className="nw-label">Description</span>
          <textarea
            className="nw-input mt-1 min-h-[60px] resize-none"
            value={facet.description}
            onChange={(e) => onPatch({ description: e.target.value })}
            aria-label="Description"
          />
        </div>

        {/* Tasks */}
        <div>
          <span className="nw-label">Tasks</span>
          <ul className="mt-1 space-y-1">
            {facet.tasks.map((t) => (
              <TaskRow key={t.id} task={t} depth={0} />
            ))}
          </ul>
          <form
            className="mt-1.5 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!newTask.trim()) return;
              onPatch({
                tasks: [
                  ...facet.tasks,
                  { id: uid(), text: newTask.trim(), done: false, subtasks: [] },
                ],
              });
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

        {/* Last accessed beside due */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="nw-label">Last accessed</span>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {new Date(facet.lastAccessed).toLocaleString()}
            </p>
          </div>
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
        </div>

        {/* Unlimited reminders */}
        <div>
          <div className="flex items-center justify-between">
            <span className="nw-label">Reminders</span>
            <button
              className="text-[11px] text-primary hover:underline"
              type="button"
              onClick={() =>
                onPatch({
                  reminders: [
                    ...facet.reminders,
                    { id: uid(), at: "", label: "Reminder" } as Reminder,
                  ],
                })
              }
            >
              + add
            </button>
          </div>
          <ul className="mt-1 space-y-1">
            {facet.reminders.map((r) => (
              <li key={r.id} className="flex gap-2">
                <input
                  className="nw-input max-w-[38%]"
                  value={r.label}
                  onChange={(e) =>
                    onPatch({
                      reminders: facet.reminders.map((x) =>
                        x.id === r.id ? { ...x, label: e.target.value } : x,
                      ),
                    })
                  }
                  aria-label="Reminder label"
                />
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
              Reminders are stored on this device only — no system notifications are sent.
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
      </div>

      <footer className="flex gap-2 border-t border-border/60 px-3 py-2">
        <button
          onClick={onCustomize}
          className="flex-1 rounded-lg border border-border bg-card/60 py-2 text-xs tracking-[0.16em] uppercase hover:bg-accent/25"
        >
          Customize
        </button>
        <button
          onClick={onClose}
          data-testid="nw-save-continue"
          className="flex-1 rounded-lg border border-primary/60 bg-primary/15 py-2 text-xs tracking-[0.16em] uppercase hover:bg-primary/25"
        >
          Save &amp; continue
        </button>
      </footer>
    </div>
  );
}
