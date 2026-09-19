import { useEffect, useRef, useState } from "react";
import type { Facet } from "@/lib/noteworthy/types";
import type { HubState } from "@/lib/noteworthy/hub-types";
import { FacetSurface } from "./FacetSurface";

/**
 * Compact upper bar. Tapping the dead-centre capture zone opens an inline
 * quick-entry field that autosaves while typing; submitting appends the next
 * numbered entry to Tab A. The side control unfolds the full hub workspace.
 */
export function HubBar({
  facet,
  hub,
  ambient,
  reduced,
  onOpen,
  onQuickChange,
  onQuickCommit,
  recede,
  hidden,
}: {
  facet: Facet;
  hub: HubState;
  ambient: number;
  reduced: boolean;
  onOpen: (el: HTMLElement) => void;
  onQuickChange: (text: string) => void;
  onQuickCommit: (text: string) => void;
  recede?: boolean;
  hidden?: boolean;
}) {
  const [capturing, setCapturing] = useState(false);
  const [text, setText] = useState(hub.quick.text);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const dirty = useRef(false);
  const wrap = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  // Adopt the persisted draft until the user types — never overwrite it.
  useEffect(() => {
    if (!dirty.current) setText(hub.quick.text);
  }, [hub.quick.text]);

  useEffect(() => {
    if (!dirty.current) return;
    setStatus("saving");
    const t = setTimeout(() => {
      onQuickChange(text);
      setStatus("saved");
    }, 400);
    return () => clearTimeout(t);
  }, [text, onQuickChange]);

  useEffect(() => {
    if (capturing) input.current?.focus();
  }, [capturing]);

  const entries = hub.entries.length;

  return (
    <div
      ref={wrap}
      data-testid="nw-util-top"
      className={`h-full w-full min-w-0 ${recede ? "nw-recede" : ""} ${hidden ? "nw-source-hidden" : ""}`}
    >
      <FacetSurface facet={facet} ambient={ambient} className="h-full w-full" float={!reduced}>
        <div className="relative z-[3] flex h-full min-w-0 items-center gap-1.5 px-2">
          <span className="shrink-0 text-[12px] opacity-80" aria-hidden>
            ❖
          </span>

          {capturing ? (
            <form
              className="flex min-w-0 flex-1 items-center gap-1.5"
              onSubmit={(e) => {
                e.preventDefault();
                if (!text.trim()) return;
                onQuickCommit(text);
                dirty.current = false;
                setText("");
                setStatus("saved");
              }}
            >
              <input
                ref={input}
                data-testid="nw-hub-quick"
                aria-label="Quick entry — autosaves, saves into Tab A"
                placeholder="Capture into Tab A…"
                value={text}
                onChange={(e) => {
                  dirty.current = true;
                  setText(e.target.value);
                }}
                onKeyDown={(e) => e.key === "Escape" && setCapturing(false)}
                className="min-w-0 flex-1 bg-transparent text-[11px] text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
              />
              <span
                aria-live="polite"
                className="shrink-0 text-[8px] tracking-widest text-muted-foreground uppercase"
              >
                {status === "saving" ? "saving" : status === "saved" ? "saved" : ""}
              </span>
              <BarAction label="Save to Tab A" glyph="⏎" testId="nw-hub-quick-save" />
            </form>
          ) : (
            <button
              type="button"
              data-testid="nw-hub-capture-zone"
              aria-label="Quick entry — capture into Tab A"
              onClick={() => setCapturing(true)}
              className="flex min-w-0 flex-1 items-center gap-2 text-left"
            >
              <span className="shrink-0 truncate font-display text-[9.5px] font-semibold tracking-[0.16em] uppercase">
                Repository
              </span>
              <span className="min-w-0 flex-1 truncate text-center text-[9px] text-muted-foreground/80">
                {hub.quick.text ? `draft: ${hub.quick.text}` : "tap centre to capture"}
              </span>
              <span className="shrink-0 text-[8.5px] tracking-widest text-muted-foreground uppercase">
                {entries} {entries === 1 ? "entry" : "entries"}
              </span>
            </button>
          )}

          <BarAction
            label="Open repository and notebook"
            glyph="⤢"
            testId="nw-hub-expand"
            onClick={() => wrap.current && onOpen(wrap.current)}
          />
        </div>
      </FacetSurface>
    </div>
  );
}

function BarAction({
  label,
  glyph,
  onClick,
  testId,
}: {
  label: string;
  glyph: string;
  onClick?: () => void;
  testId?: string;
}) {
  return (
    <button
      type={onClick ? "button" : "submit"}
      aria-label={label}
      title={label}
      data-testid={testId}
      onClick={onClick}
      className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-border/70 bg-card/50 text-[10px]"
    >
      {glyph}
    </button>
  );
}
