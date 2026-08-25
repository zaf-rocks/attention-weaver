import { useMemo, useState } from "react";
import type { UtilityApi } from "@/lib/noteworthy/utility-store";
import { copyText } from "@/lib/noteworthy/destinations";
import { WorkspaceHeader } from "./UtilityStage";

/** Full repository workspace: tabs, search, clips. No Weight or lock UI ever. */
export function RepositoryWorkspace({ api, onClose }: { api: UtilityApi; onClose: () => void }) {
  const { utility } = api;
  const [query, setQuery] = useState("");
  const [editingTab, setEditingTab] = useState(false);
  const [toast, setToast] = useState("");
  const active = utility.tabs.find((t) => t.id === utility.activeTabId) ?? utility.tabs[0]!;

  const clips = useMemo(() => {
    const q = query.trim().toLowerCase();
    return utility.clips
      .filter((c) => (q ? true : c.tabId === active.id))
      .filter((c) =>
        q
          ? c.title.toLowerCase().includes(q) ||
            c.body.toLowerCase().includes(q) ||
            c.tags.join(" ").toLowerCase().includes(q)
          : true,
      )
      .sort((a, b) => Number(b.pinned) - Number(a.pinned));
  }, [utility.clips, active.id, query]);

  const say = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2200);
  };

  return (
    <div className="flex h-full flex-col">
      <WorkspaceHeader
        title="Prompt Repository"
        subtitle={`${utility.tabs.length} tabs · ${utility.clips.length} clips`}
        onClose={onClose}
      />

      <div className="border-b border-border/50 px-2 py-1.5">
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Repository tabs">
          {utility.tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={t.id === active.id}
              onClick={() => {
                api.setActiveTab(t.id);
                setEditingTab(false);
              }}
              className={`flex items-center gap-1 rounded-md border px-1.5 py-1 text-[9px] ${
                t.id === active.id
                  ? "border-primary/70 bg-primary/15 text-foreground"
                  : "border-border/70 text-muted-foreground"
              }`}
            >
              <span className="font-semibold tracking-widest">{t.code}</span>
              <span className="max-w-[74px] truncate">{t.name}</span>
            </button>
          ))}
          <button
            onClick={() => api.addTab("+", "New Tab")}
            aria-label="Add tab"
            className="rounded-md border border-border/70 px-2 py-1 text-[9px]"
          >
            ＋
          </button>
        </div>

        <div className="mt-1.5 flex items-center gap-1">
          <button
            onClick={() => setEditingTab((v) => !v)}
            className="rounded border border-border/70 px-1.5 py-0.5 text-[9px]"
          >
            {editingTab ? "Done" : "Edit tab"}
          </button>
          <button
            aria-label="Move tab earlier"
            onClick={() => api.moveTab(active.id, -1)}
            className="rounded border border-border/70 px-1.5 py-0.5 text-[9px]"
          >
            ←
          </button>
          <button
            aria-label="Move tab later"
            onClick={() => api.moveTab(active.id, 1)}
            className="rounded border border-border/70 px-1.5 py-0.5 text-[9px]"
          >
            →
          </button>
          <input
            aria-label="Search repository"
            placeholder="Search all clips…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="nw-input ml-auto h-6 max-w-[45%] py-0 text-[10px]"
          />
        </div>

        {editingTab && (
          <div className="mt-1.5 flex items-center gap-1">
            <input
              aria-label="Tab shortcut code"
              value={active.code}
              onChange={(e) => api.patchTab(active.id, { code: e.target.value.slice(0, 3) })}
              className="nw-input h-6 w-12 py-0 text-center text-[10px]"
            />
            <input
              aria-label="Tab name"
              value={active.name}
              onChange={(e) => api.patchTab(active.id, { name: e.target.value })}
              className="nw-input h-6 flex-1 py-0 text-[10px]"
            />
            <button
              onClick={() => {
                if (confirm(`Delete “${active.name}” and its clips?`)) api.deleteTab(active.id);
              }}
              className="rounded border border-destructive/60 px-1.5 py-0.5 text-[9px] text-destructive"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="nw-scroll flex-1 space-y-1.5 px-2 py-2">
        <button
          onClick={() => api.addClip(active.id)}
          className="w-full rounded-lg border border-border/70 py-1.5 text-[10px] tracking-widest uppercase"
        >
          + New clip in {active.name}
        </button>
        {clips.length === 0 && (
          <p className="py-6 text-center text-[10px] text-muted-foreground">No clips here yet.</p>
        )}
        {clips.map((c, i) => (
          <article key={c.id} className="rounded-lg border border-border/60 bg-card/40 p-1.5">
            <div className="flex items-center gap-1">
              <span
                aria-hidden
                className="grid h-6 w-6 shrink-0 place-items-center rounded border border-border/70 font-display text-[9px] text-muted-foreground"
              >
                {i + 1}
              </span>
              <input
                aria-label="Clip title"
                value={c.title}
                onChange={(e) => api.patchClip(c.id, { title: e.target.value })}
                className="nw-input h-6 flex-1 py-0 text-[10.5px]"
              />
              <button
                aria-label={c.pinned ? "Unpin clip" : "Pin clip"}
                onClick={() => api.patchClip(c.id, { pinned: !c.pinned })}
                className={`rounded border border-border/70 px-1 text-[10px] ${c.pinned ? "text-primary" : ""}`}
              >
                ⚑
              </button>
            </div>
            <textarea
              aria-label="Clip body"
              value={c.body}
              rows={2}
              onChange={(e) => api.patchClip(c.id, { body: e.target.value })}
              className="nw-input mt-1 resize-y text-[10.5px]"
            />
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <input
                aria-label="Clip tags"
                placeholder="tags, comma separated"
                value={c.tags.join(", ")}
                onChange={(e) =>
                  api.patchClip(c.id, {
                    tags: e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
                className="nw-input h-6 flex-1 py-0 text-[9.5px]"
              />
              <label className="flex items-center gap-1 text-[8.5px] text-muted-foreground">
                reuse
                <input
                  aria-label="Reuse reminder interval in days"
                  type="number"
                  min={0}
                  value={c.reuseIntervalDays ?? ""}
                  onChange={(e) =>
                    api.patchClip(c.id, {
                      reuseIntervalDays: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="nw-input h-6 w-12 py-0 text-[9.5px]"
                />
                d
              </label>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <button
                onClick={async () => {
                  const r = await copyText(c.body || c.title);
                  api.markUsed(c.id);
                  say(r.message);
                }}
                className="rounded border border-border/70 px-1.5 py-0.5 text-[9px]"
              >
                Copy / use
              </button>
              <button
                onClick={() => api.duplicateClip(c.id)}
                className="rounded border border-border/70 px-1.5 py-0.5 text-[9px]"
              >
                Duplicate
              </button>
              <button
                aria-label="Move clip up"
                onClick={() => api.moveClip(c.id, -1)}
                className="rounded border border-border/70 px-1.5 py-0.5 text-[9px]"
              >
                ↑
              </button>
              <button
                aria-label="Move clip down"
                onClick={() => api.moveClip(c.id, 1)}
                className="rounded border border-border/70 px-1.5 py-0.5 text-[9px]"
              >
                ↓
              </button>
              <button
                onClick={() => confirm("Delete this clip?") && api.deleteClip(c.id)}
                className="rounded border border-destructive/60 px-1.5 py-0.5 text-[9px] text-destructive"
              >
                Delete
              </button>
              <span className="ml-auto text-[8px] text-muted-foreground">
                {c.lastUsedAt ? `used ${new Date(c.lastUsedAt).toLocaleDateString()}` : "unused"}
                {c.reuseIntervalDays ? ` · reminder ${c.reuseIntervalDays}d (local only)` : ""}
              </span>
            </div>

            <div className="mt-1.5 rounded-md border border-border/50 p-1.5">
              <p className="mb-1 text-[8.5px] tracking-widest text-muted-foreground uppercase">
                Alarms
              </p>
              {c.reminders.map((r) => {
                const due = !r.done && new Date(r.at).getTime() <= Date.now();
                return (
                  <div key={r.id} className="mb-1 flex flex-wrap items-center gap-1">
                    <input
                      aria-label="Alarm time"
                      type="datetime-local"
                      value={r.at}
                      onChange={(e) => api.patchReminder(c.id, r.id, { at: e.target.value })}
                      className="nw-input h-6 w-[150px] py-0 text-[9.5px]"
                    />
                    <input
                      aria-label="Alarm label"
                      placeholder="label"
                      value={r.label}
                      onChange={(e) => api.patchReminder(c.id, r.id, { label: e.target.value })}
                      className="nw-input h-6 min-w-0 flex-1 py-0 text-[9.5px]"
                    />
                    {due && (
                      <span className="rounded border border-primary/70 px-1 text-[8px] text-primary">
                        due
                      </span>
                    )}
                    <button
                      onClick={() => api.patchReminder(c.id, r.id, { done: !r.done })}
                      className="rounded border border-border/70 px-1.5 py-0.5 text-[9px]"
                    >
                      {r.done ? "Reopen" : "Done"}
                    </button>
                    <button
                      aria-label="Remove alarm"
                      onClick={() => api.removeReminder(c.id, r.id)}
                      className="rounded border border-destructive/60 px-1.5 py-0.5 text-[9px] text-destructive"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
              <button
                onClick={() => {
                  const d = new Date(Date.now() + 60 * 60 * 1000 - new Date().getTimezoneOffset() * 60000);
                  api.addReminder(c.id, d.toISOString().slice(0, 16), "");
                }}
                className="rounded border border-border/70 px-1.5 py-0.5 text-[9px]"
              >
                + Add alarm
              </button>
            </div>
          </article>
        ))}
        <p className="pt-1 text-[8px] leading-relaxed text-muted-foreground">
          Alarms and reuse reminders are stored locally and surface inside Noteworthy while it is
          open — this prototype schedules no operating-system notifications.
        </p>
      </div>

      {toast && (
        <div
          role="status"
          className="border-t border-border/60 px-3 py-1 text-[9.5px] text-muted-foreground"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
