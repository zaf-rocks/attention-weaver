import { useEffect, useRef, useState } from "react";
import type { Facet } from "@/lib/noteworthy/types";
import type { UtilityState } from "@/lib/noteworthy/utility-types";
import { copyText } from "@/lib/noteworthy/destinations";
import { FacetSurface } from "./FacetSurface";

/**
 * Immediately usable capture surface. Typing here autosaves with a short
 * debounce; only the dedicated ⤢ control unfolds the full workspace.
 */
export function CaptureBar({
  facet,
  utility,
  ambient,
  reduced,
  onOpen,
  onDraft,
  onSaveDefault,
  recede,
  hidden,
}: {
  facet: Facet;
  utility: UtilityState;
  ambient: number;
  reduced: boolean;
  onOpen: (el: HTMLElement) => void;
  onDraft: (text: string) => void;
  onSaveDefault: (text: string) => void;
  recede?: boolean;
  hidden?: boolean;
}) {
  const [text, setText] = useState(utility.draft.text);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const dirty = useRef(false);
  const wrap = useRef<HTMLDivElement>(null);

  // Adopt hydrated/persisted draft until the user starts typing.
  useEffect(() => {
    if (!dirty.current) setText(utility.draft.text);
  }, [utility.draft.text]);

  useEffect(() => {
    if (!dirty.current) return;
    setStatus("saving");
    const t = setTimeout(() => {
      onDraft(text);
      setStatus("saved");
    }, 450);
    return () => clearTimeout(t);
  }, [text, onDraft]);

  return (
    <div
      ref={wrap}
      data-testid="nw-util-bottom"
      className={`h-full w-full min-w-0 ${recede ? "nw-recede" : ""} ${hidden ? "nw-source-hidden" : ""}`}
    >
      <FacetSurface facet={facet} ambient={ambient} className="h-full w-full" float={!reduced}>
        <div className="relative z-[3] flex h-full min-w-0 items-center gap-1.5 px-2">
          <input
            data-testid="nw-capture-input"
            aria-label="Quick capture — autosaves as you type"
            placeholder="Capture a thought…"
            value={text}
            onChange={(e) => {
              dirty.current = true;
              setText(e.target.value);
            }}
            className="min-w-0 flex-1 bg-transparent text-[11px] text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
          />
          <span
            aria-live="polite"
            className="shrink-0 text-[8px] tracking-widest text-muted-foreground uppercase"
          >
            {status === "saving" ? "saving" : status === "saved" ? "saved" : ""}
          </span>
          <BarAction
            label="Save to repository"
            glyph="⭳"
            onClick={() => onSaveDefault(text)}
            disabled={!text.trim()}
          />
          <BarAction
            label="Copy capture"
            glyph="⧉"
            onClick={() => void copyText(text)}
            disabled={!text.trim()}
          />
          <BarAction
            label="Open capture workspace"
            glyph="⤢"
            onClick={() => wrap.current && onOpen(wrap.current)}
            testId="nw-capture-expand"
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
  disabled,
  testId,
}: {
  label: string;
  glyph: string;
  onClick: () => void;
  disabled?: boolean;
  testId?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      data-testid={testId}
      disabled={disabled}
      onClick={onClick}
      className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-border/70 bg-card/50 text-[10px] disabled:opacity-35"
    >
      {glyph}
    </button>
  );
}
