import { useRef, useState } from "react";

/**
 * Deliberate deletion: a single tap never deletes. The user must press and
 * hold for ~0.8s while a ring fills; releasing early cancels.
 */
export function HoldDelete({ label, onDelete }: { label: string; onDelete: () => void }) {
  const [holding, setHolding] = useState(false);
  const [hint, setHint] = useState(false);
  const timer = useRef<number | null>(null);
  const start = (e: React.PointerEvent) => {
    e.preventDefault();
    setHolding(true);
    timer.current = window.setTimeout(() => {
      setHolding(false);
      onDelete();
    }, 800);
  };
  const cancel = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    if (holding) {
      setHint(true);
      window.setTimeout(() => setHint(false), 1200);
    }
    setHolding(false);
  };
  return (
    <button
      type="button"
      aria-label={`${label} (press and hold)`}
      title="Press and hold to delete"
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if (e.key === "Delete" && e.shiftKey) onDelete();
      }}
      className="relative grid h-4 w-4 shrink-0 touch-none place-items-center rounded-full border border-border/60 bg-card text-[8px] text-muted-foreground select-none"
    >
      <span
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{
          background: "conic-gradient(var(--destructive) var(--p), transparent 0)",
          ["--p" as string]: holding ? "100%" : "0%",
          transition: holding ? "--p 0.8s linear" : "none",
          opacity: holding ? 0.85 : 0,
        }}
      />
      <span className="relative">✕</span>
      {hint && (
        <span className="absolute -top-5 left-1/2 -translate-x-1/2 rounded bg-card px-1 text-[8px] whitespace-nowrap text-foreground">
          Hold to delete
        </span>
      )}
    </button>
  );
}
