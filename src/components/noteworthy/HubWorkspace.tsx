import { useEffect, useRef, useState } from "react";
import type { Facet } from "@/lib/noteworthy/types";
import type { HubEntry, HubLetter } from "@/lib/noteworthy/hub-types";
import { LETTERS, entriesOf, type HubApi } from "@/lib/noteworthy/hub-store";
import { canShare, copyText } from "@/lib/noteworthy/destinations";
import { CustomizeFace } from "./CustomizeFace";
import { WorkspaceHeader } from "./UtilityStage";

type Panel = "repository" | "notebook" | "customize";

/** Upper utility workspace: lettered repository, notebook composer, customize. */
export function HubWorkspace({
  api,
  facet,
  onPatchFacet,
  onClose,
}: {
  api: HubApi;
  facet: Facet;
  onPatchFacet: (patch: Partial<Facet>) => void;
  onClose: () => void;
}) {
  const [panel, setPanel] = useState<Panel>("repository");
  const [openId, setOpenId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { hub } = api;
  const tab = hub.tabs.find((t) => t.letter === hub.activeLetter)!;
  const entries = entriesOf(hub, hub.activeLetter);

  const say = (m: string) => {
    setMessage(m);
    setTimeout(() => setMessage(null), 2600);
  };

  if (panel === "customize") {
    return (
      <CustomizeFace
        facet={facet}
        onPatch={onPatchFacet}
        onBack={() => setPanel("repository")}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <WorkspaceHeader
        title="Repository & Notebook"
        subtitle={`Tab ${tab.letter} · ${tab.label} · ${entries.length} entries`}
        onClose={onClose}
      >
        <PanelToggle panel={panel} onChange={setPanel} />
      </WorkspaceHeader>

      {panel === "repository" ? (
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Lettered, colour-coded primary tabs */}
          <div className="nw-scroll-x flex shrink-0 gap-1 overflow-x-auto border-b border-border/60 px-2 py-1.5">
            {LETTERS.map((letter) => {
              const t = hub.tabs.find((x) => x.letter === letter)!;
              const active = letter === hub.activeLetter;
              return (
                <button
                  key={letter}
                  type="button"
                  data-testid={`nw-hub-tab-${letter}`}
                  onClick={() => api.setActiveLetter(letter)}
                  aria-pressed={active}
                  title={`${letter} — ${t.label}`}
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-md border text-[11px] font-semibold ${
                    active ? "border-primary" : "border-border/60"
                  }`}
                  style={{
                    background: active ? `${t.color}33` : "transparent",
                    color: t.color,
                    boxShadow: active ? `0 0 10px ${t.color}66` : undefined,
                  }}
                >
                  {letter}
                </button>
              );
            })}
          </div>

          {/* Tab label + entry actions */}
          <div className="flex shrink-0 items-center gap-2 px-3 py-2">
            <input
              className="nw-input text-[12px]"
              value={tab.label}
              onChange={(e) => api.patchTab(tab.letter, { label: e.target.value })}
              aria-label={`Label for tab ${tab.letter}`}
            />
            <input
              type="color"
              className="h-7 w-8 shrink-0 rounded border border-border/60 bg-transparent"
              value={tab.color}
              onChange={(e) => api.patchTab(tab.letter, { color: e.target.value })}
              aria-label={`Colour for tab ${tab.letter}`}
            />
            <button
              type="button"
              data-testid="nw-hub-add-entry"
              onClick={() => setOpenId(api.addEntry(tab.letter))}
              className="shrink-0 rounded-lg border border-border px-2 py-1 text-[11px] hover:bg-accent/25"
            >
              + entry
            </button>
          </div>

          <ul className="nw-scroll min-h-0 flex-1 space-y-1.5 px-3 pb-3">
            {entries.length === 0 && (
              <li className="text-[11px] text-muted-foreground">
                No entries in {tab.letter} yet.
              </li>
            )}
            {entries.map((entry, i) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                code={`${entry.letter}${i + 1}`}
                color={tab.color}
                open={openId === entry.id}
                onToggle={() => setOpenId(openId === entry.id ? null : entry.id)}
                api={api}
                onSay={say}
              />
            ))}
          </ul>
        </div>
      ) : (
        <Notebook api={api} onSay={say} />
      )}

      <footer className="flex shrink-0 items-center gap-2 border-t border-border/60 px-3 py-2">
        <span aria-live="polite" className="min-w-0 flex-1 truncate text-[10px] text-muted-foreground">
          {message ?? "Saved locally on this device."}
        </span>
        <button
          onClick={onClose}
          data-testid="nw-hub-return"
          className="shrink-0 rounded-lg border border-primary/60 bg-primary/15 px-3 py-1.5 text-[11px] tracking-[0.16em] uppercase"
        >
          Return to field
        </button>
      </footer>
    </div>
  );
}

function PanelToggle({ panel, onChange }: { panel: Panel; onChange: (p: Panel) => void }) {
  const opts: Array<[Panel, string]> = [
    ["repository", "Repo"],
    ["notebook", "Notes"],
    ["customize", "Customize"],
  ];
  return (
    <div className="flex shrink-0 gap-1">
      {opts.map(([id, label]) => (
        <button
          key={id}
          type="button"
          data-testid={`nw-hub-panel-${id}`}
          aria-pressed={panel === id}
          onClick={() => onChange(id)}
          className={`rounded-md border px-2 py-1 text-[10px] tracking-widest uppercase ${
            panel === id ? "border-primary bg-primary/15" : "border-border/60"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function EntryRow({
  entry,
  code,
  color,
  open,
  onToggle,
  api,
  onSay,
}: {
  entry: HubEntry;
  code: string;
  color: string;
  open: boolean;
  onToggle: () => void;
  api: HubApi;
  onSay: (m: string) => void;
}) {
  return (
    <li className="rounded-lg border border-border/60 bg-card/40">
      <div className="flex items-center gap-2 px-2 py-1.5">
        <span
          className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold"
          style={{ background: `${color}26`, color }}
        >
          {code}
        </span>
        <button
          type="button"
          onClick={onToggle}
          className="min-w-0 flex-1 truncate text-left text-[11.5px]"
          aria-expanded={open}
        >
          {entry.title || "Untitled entry"}
        </button>
        <IconBtn label="Move up" glyph="↑" onClick={() => api.moveEntry(entry.id, -1)} />
        <IconBtn label="Move down" glyph="↓" onClick={() => api.moveEntry(entry.id, 1)} />
        <IconBtn
          label="Copy entry"
          glyph="⧉"
          onClick={async () => onSay((await copyText(entry.body || entry.title)).message)}
        />
      </div>

      {open && (
        <div className="space-y-1.5 border-t border-border/50 px-2 py-2">
          <input
            className="nw-input text-[11.5px]"
            value={entry.title}
            onChange={(e) => api.patchEntry(entry.id, { title: e.target.value })}
            aria-label="Entry title"
          />
          <textarea
            className="nw-input min-h-[90px] resize-y text-[11.5px]"
            value={entry.body}
            onChange={(e) => api.patchEntry(entry.id, { body: e.target.value })}
            aria-label="Entry text"
          />
          <div className="flex flex-wrap items-center gap-1.5">
            <label className="flex items-center gap-1 text-[10px] text-muted-foreground">
              Tab
              <select
                className="rounded border border-border/60 bg-card/60 px-1 py-0.5 text-[10px]"
                value={entry.letter}
                onChange={(e) => api.moveEntryToTab(entry.id, e.target.value as HubLetter)}
                aria-label="Move entry to tab"
              >
                {LETTERS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            {canShare() && (
              <SmallBtn
                label="Share"
                onClick={async () => {
                  try {
                    await navigator.share({ text: entry.body || entry.title });
                    onSay("Handed to the system share sheet.");
                  } catch {
                    onSay("Share cancelled or unavailable.");
                  }
                }}
              />
            )}
            <SmallBtn
              label="Email draft"
              onClick={() => {
                window.location.href = `mailto:?subject=${encodeURIComponent(
                  entry.title,
                )}&body=${encodeURIComponent(entry.body)}`;
                onSay("Opened your mail handler, if one is configured.");
              }}
            />
            <SmallBtn
              label="Delete"
              danger
              onClick={() => {
                if (window.confirm(`Delete "${entry.title || "this entry"}"?`)) {
                  api.deleteEntry(entry.id);
                  onSay("Entry deleted.");
                }
              }}
            />
          </div>
        </div>
      )}
    </li>
  );
}

function Notebook({ api, onSay }: { api: HubApi; onSay: (m: string) => void }) {
  const [text, setText] = useState(api.hub.composer.text);
  const dirty = useRef(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!dirty.current) setText(api.hub.composer.text);
  }, [api.hub.composer.text]);

  useEffect(() => {
    if (!dirty.current) return;
    const t = setTimeout(() => api.setComposer(text), 450);
    return () => clearTimeout(t);
  }, [text, api]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 px-3 py-2">
      <textarea
        data-testid="nw-hub-composer"
        aria-label="Notebook — autosaves as you type"
        className="nw-input min-h-0 flex-1 resize-y text-[12px] leading-relaxed"
        placeholder="Draft an email, a message, a longer thought…"
        value={text}
        onChange={(e) => {
          dirty.current = true;
          setText(e.target.value);
        }}
      />
      <div className="flex flex-wrap items-center gap-1.5">
        <SmallBtn
          label="Save to Tab A"
          onClick={() => {
            if (!text.trim()) return;
            api.addEntry("A", {
              title: text.trim().split("\n")[0]!.slice(0, 60),
              body: text,
            });
            api.commitComposerHistory(text);
            onSay("Saved as the next numbered entry in Tab A.");
          }}
        />
        <SmallBtn label="Copy" onClick={async () => onSay((await copyText(text)).message)} />
        <SmallBtn
          label="Keep a version"
          onClick={() => {
            api.commitComposerHistory(text);
            onSay("Version kept in history.");
          }}
        />
        <SmallBtn
          label={showHistory ? "Hide history" : `History (${api.hub.history.length})`}
          onClick={() => setShowHistory((v) => !v)}
        />
      </div>
      {showHistory && (
        <ul className="nw-scroll max-h-[28%] space-y-1">
          {api.hub.history.length === 0 && (
            <li className="text-[10px] text-muted-foreground">No kept versions yet.</li>
          )}
          {api.hub.history.map((h) => (
            <li key={h.id} className="flex items-center gap-2 text-[10px]">
              <span className="shrink-0 text-muted-foreground">
                {new Date(h.savedAt).toLocaleString()}
              </span>
              <span className="min-w-0 flex-1 truncate">{h.text}</span>
              <SmallBtn
                label="Restore"
                onClick={() => {
                  dirty.current = true;
                  setText(h.text);
                  onSay("Version restored into the notebook.");
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function IconBtn({ label, glyph, onClick }: { label: string; glyph: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-border/60 text-[10px] hover:bg-accent/25"
    >
      {glyph}
    </button>
  );
}

function SmallBtn({
  label,
  onClick,
  danger,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-2 py-1 text-[10px] ${
        danger ? "border-destructive/60 text-destructive" : "border-border/60 hover:bg-accent/25"
      }`}
    >
      {label}
    </button>
  );
}
