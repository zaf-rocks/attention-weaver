import { useEffect, useRef, useState } from "react";
import type { Facet } from "@/lib/noteworthy/types";
import type { BoardState } from "@/lib/noteworthy/board-types";
import { FacetSurface } from "./FacetSurface";

/**
 * Compact lower bar. The dead-centre capture zone opens a quick field that
 * autosaves while typing and files the submitted text into the designated
 * Save for Later note. The side control unfolds the corkboard.
 */
export function BoardBar({
  facet,
  board,
  ambient,
  reduced,
  onOpen,
  onQuickChange,
  onQuickCommit,
  recede,
  hidden,
}: {
  facet: Facet;
  board: BoardState;
  ambient: number;
  reduced: boolean;
  onOpen: (el: HTMLElement) => void;
  onQuickChange: (text: string) => void;
  onQuickCommit: (text: string) => void;
  recede?: boolean;
  hidden?: boolean;
}) {
  const [capturing, setCapturing] = useState(false);
  const [text, setText] = useState(board.quick.text);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const dirty = useRef(false);
  const wrap = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!dirty.current) setText(board.quick.text);
  }, [board.quick.text]);

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

  const target = board.notes.find((n) => n.id === board.saveForLaterId);

  // Live destination hint: a trailing #n1-#n12 routes onto that Post-it.
  const routeTarget = (() => {
    const m = /#n([1-9]|1[0-2])\s*$/i.exec(text);
    if (!m) return null;
    return board.notes.filter((n) => !n.archived)[Number(m[1]) - 1] ?? null;
  })();
  const destination = routeTarget ?? target;

  return (
    <div
      ref={wrap}
      data-testid="nw-util-bottom"
      className={`h-full w-full min-w-0 ${recede ? "nw-recede" : ""} ${hidden ? "nw-source-hidden" : ""}`}
    >
      <FacetSurface facet={facet} ambient={ambient} className="h-full w-full" float={!reduced}>
        <div className="relative z-[3] flex h-full min-w-0 items-center gap-1.5 px-2">
          <span className="shrink-0 text-[12px] opacity-80" aria-hidden>
            ▣
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
                data-testid="nw-board-quick"
                aria-label={`Quick thought — saves into ${target?.title ?? "Save for Later"}`}
                placeholder={`Save into ${target?.title ?? "Save for Later"}…`}
                value={text}
                onChange={(e) => {
                  dirty.current = true;
                  setText(e.target.value);
                }}
                onKeyDown={(e) => e.key === "Escape" && setCapturing(false)}
                className="min-w-0 flex-1 bg-transparent text-[11px] text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
              />
              {routeTarget ? (
                <span
                  data-testid="nw-board-route-hint"
                  className="shrink-0 rounded px-1 py-0.5 text-[8px] font-semibold tracking-widest uppercase"
                  style={{ background: `${routeTarget.color}33`, color: routeTarget.color }}
                >
                  → {routeTarget.title}
                </span>
              ) : (
                <span
                  aria-live="polite"
                  className="shrink-0 text-[8px] tracking-widest text-muted-foreground uppercase"
                >
                  {status === "saving" ? "saving" : status === "saved" ? "saved" : ""}
                </span>
              )}
              <BarAction
                label={`Save to ${destination?.title ?? "note"}`}
                glyph="⏎"
                testId="nw-board-quick-save"
              />
            </form>
          ) : (
            <button
              type="button"
              data-testid="nw-board-capture-zone"
              aria-label="Quick thought — save into a Post-it note"
              onClick={() => setCapturing(true)}
              className="flex min-w-0 flex-1 items-center gap-2 text-left"
            >
              <span className="shrink-0 truncate font-display text-[9.5px] font-semibold tracking-[0.16em] uppercase">
                Corkboard
              </span>
              <span className="min-w-0 flex-1 truncate text-center text-[9px] text-muted-foreground/80">
                {board.quick.text ? `draft: ${board.quick.text}` : "tap centre for a quick thought"}
              </span>
              <span className="shrink-0 truncate text-[8.5px] tracking-widest text-muted-foreground uppercase">
                → {target?.title ?? "Save for Later"}
              </span>
            </button>
          )}

          <BarAction
            label="Open corkboard"
            glyph="⤢"
            testId="nw-board-expand"
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
