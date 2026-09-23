import { useEffect, useRef, useState } from "react";
import type { UtilityApi } from "@/lib/noteworthy/utility-store";
import { destinationUnavailable, runDestination } from "@/lib/noteworthy/destinations";
import { WorkspaceHeader } from "./UtilityStage";

/**
 * Expanded capture dock: the same physical object as the lower bar, unfolded.
 * Autosaves locally, keeps recoverable recent drafts, and routes the text to
 * repository tabs or user-configured destinations.
 */
export function CaptureWorkspace({ api, onClose }: { api: UtilityApi; onClose: () => void }) {
  const { utility } = api;
  const [text, setText] = useState(utility.draft.text);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [toast, setToast] = useState("");
  const [targets, setTargets] = useState<string[]>(utility.defaultTabIds);
  const [tab, setTab] = useState<"capture" | "drafts" | "destinations">("capture");
  const dirty = useRef(false);

  useEffect(() => {
    if (!dirty.current) return;
    setStatus("saving");
    const t = setTimeout(() => {
      api.setDraft(text);
      setStatus("saved");
    }, 400);
    return () => clearTimeout(t);
  }, [text, api]);

  const say = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2400);
  };

  const saveToTabs = () => {
    const body = text.trim();
    if (!body) return say("Nothing to save.");
    const ids = targets.length ? targets : [utility.tabs[0]!.id];
    ids.forEach((tabId) =>
      api.addClip(tabId, { title: body.split("\n")[0]!.slice(0, 60) || "Capture", body }),
    );
    api.commitHistory(text);
    api.clearDraft();
    dirty.current = false;
    setText("");
    say(`Saved into ${ids.length} tab${ids.length > 1 ? "s" : ""}.`);
  };

  return (
    <div className="flex h-full flex-col">
      <WorkspaceHeader
        title="Capture Dock"
        subtitle={
          utility.draft.savedAt
            ? `autosaved ${new Date(utility.draft.savedAt).toLocaleTimeString()}`
            : "autosaves as you type"
        }
        onClose={onClose}
      />

      <div className="flex gap-1 border-b border-border/50 px-2 py-1.5">
        {(["capture", "drafts", "destinations"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded-md border px-2 py-1 text-[9px] tracking-widest uppercase ${
              tab === k
                ? "border-primary/70 bg-primary/15 text-foreground"
                : "border-border/70 text-muted-foreground"
            }`}
          >
            {k}
          </button>
        ))}
        <span className="ml-auto self-center text-[8px] tracking-widest text-muted-foreground uppercase">
          {status === "saving" ? "saving" : status === "saved" ? "saved" : ""}
        </span>
      </div>

      <div className="nw-scroll flex-1 space-y-2 px-2 py-2">
        {tab === "capture" && (
          <>
            <textarea
              data-testid="nw-capture-editor"
              aria-label="Capture editor"
              rows={8}
              value={text}
              onChange={(e) => {
                dirty.current = true;
                setText(e.target.value);
              }}
              placeholder="Write freely — this saves itself."
              className="nw-input resize-y text-[11.5px] leading-relaxed"
            />

            <div>
              <p className="mb-1 text-[8.5px] tracking-widest text-muted-foreground uppercase">
                Save into tabs
              </p>
              <div className="flex flex-wrap gap-1">
                {utility.tabs.map((t) => {
                  const on = targets.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      aria-pressed={on}
                      onClick={() =>
                        setTargets((s) => (on ? s.filter((i) => i !== t.id) : [...s, t.id]))
                      }
                      className={`flex items-center gap-1 rounded-md border px-1.5 py-1 text-[9px] ${
                        on
                          ? "border-primary/70 bg-primary/15 text-foreground"
                          : "border-border/70 text-muted-foreground"
                      }`}
                    >
                      <span className="font-semibold tracking-widest">{t.code}</span>
                      <span className="max-w-[74px] truncate">{t.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              <button
                data-testid="nw-capture-save"
                onClick={saveToTabs}
                className="rounded-md border border-primary/70 bg-primary/15 px-2 py-1 text-[9.5px] tracking-widest uppercase"
              >
                Save to repository
              </button>
              <button
                onClick={() => api.setDefaultTabs(targets)}
                className="rounded-md border border-border/70 px-2 py-1 text-[9.5px]"
              >
                Make default tabs
              </button>
              <button
                onClick={() => {
                  api.commitHistory(text);
                  api.clearDraft();
                  dirty.current = false;
                  setText("");
                  say("Draft cleared — recoverable under Drafts.");
                }}
                className="rounded-md border border-border/70 px-2 py-1 text-[9.5px]"
              >
                Clear
              </button>
            </div>

            <div className="flex flex-wrap gap-1">
              {utility.destinations
                .filter((d) => d.enabled && d.kind !== "repository")
                .map((d) => {
                  const blocked = destinationUnavailable(d);
                  return (
                    <button
                      key={d.id}
                      disabled={Boolean(blocked)}
                      title={blocked ?? d.label}
                      onClick={async () => say((await runDestination(d, text)).message)}
                      className="rounded-md border border-border/70 px-2 py-1 text-[9.5px] disabled:opacity-40"
                    >
                      {d.label}
                      {blocked ? " (unavailable)" : ""}
                    </button>
                  );
                })}
            </div>
          </>
        )}

        {tab === "drafts" && (
          <>
            {utility.history.length === 0 && (
              <p className="py-6 text-center text-[10px] text-muted-foreground">
                No recent drafts yet.
              </p>
            )}
            {utility.history.map((h) => (
              <article key={h.id} className="rounded-lg border border-border/60 bg-card/40 p-1.5">
                <p className="line-clamp-3 text-[10.5px] whitespace-pre-wrap">{h.text}</p>
                <div className="mt-1 flex items-center gap-1">
                  <button
                    onClick={() => {
                      dirty.current = true;
                      setText(h.text);
                      setTab("capture");
                    }}
                    className="rounded border border-border/70 px-1.5 py-0.5 text-[9px]"
                  >
                    Restore
                  </button>
                  <span className="ml-auto text-[8px] text-muted-foreground">
                    {new Date(h.savedAt).toLocaleString()}
                  </span>
                </div>
              </article>
            ))}
          </>
        )}

        {tab === "destinations" && (
          <>
            {utility.destinations.map((d, i) => {
              const blocked = destinationUnavailable(d);
              return (
                <article key={d.id} className="rounded-lg border border-border/60 bg-card/40 p-1.5">
                  <div className="flex items-center gap-1">
                    <input
                      aria-label="Destination label"
                      value={d.label}
                      onChange={(e) => api.patchDestination(d.id, { label: e.target.value })}
                      className="nw-input h-6 flex-1 py-0 text-[10.5px]"
                    />
                    <button
                      aria-label="Move destination up"
                      onClick={() => api.moveDestination(d.id, -1)}
                      className="rounded border border-border/70 px-1.5 py-0.5 text-[9px]"
                    >
                      ↑
                    </button>
                    <button
                      aria-label="Move destination down"
                      onClick={() => api.moveDestination(d.id, 1)}
                      className="rounded border border-border/70 px-1.5 py-0.5 text-[9px]"
                    >
                      ↓
                    </button>
                  </div>
                  {d.kind === "custom" && (
                    <input
                      aria-label="Destination URL template"
                      value={d.template ?? ""}
                      onChange={(e) => api.patchDestination(d.id, { template: e.target.value })}
                      className="nw-input mt-1 h-6 py-0 text-[9.5px]"
                    />
                  )}
                  <div className="mt-1 flex items-center gap-2">
                    <label className="flex items-center gap-1 text-[9px] text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={d.enabled}
                        onChange={(e) => api.patchDestination(d.id, { enabled: e.target.checked })}
                      />
                      shown on capture
                    </label>
                    {d.kind === "custom" && (
                      <button
                        onClick={() => api.removeDestination(d.id)}
                        className="ml-auto rounded border border-destructive/60 px-1.5 py-0.5 text-[9px] text-destructive"
                      >
                        Remove
                      </button>
                    )}
                    <span
                      className={`text-[8px] ${d.kind === "custom" ? "" : "ml-auto"} text-muted-foreground`}
                    >
                      {blocked ?? `#${i + 1} available`}
                    </span>
                  </div>
                </article>
              );
            })}
            <button
              onClick={api.addCustomDestination}
              className="w-full rounded-lg border border-border/70 py-1.5 text-[10px] tracking-widest uppercase"
            >
              + Custom URL destination
            </button>
            <p className="pt-1 text-[8px] leading-relaxed text-muted-foreground">
              A web app cannot silently target arbitrary installed apps. Repository saves and
              clipboard are fully local; share, email and URL destinations only work where the
              device provides a handler.
            </p>
          </>
        )}
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
