import { MAX_NOTCH, MIN_NOTCH, NOTCH_LABELS, clampNotch } from "@/lib/noteworthy/weight";

const NOTCHES = [-3, -2, -1, 0, 1, 2, 3] as const;

export function SizeNotchControl({
  value,
  disabled,
  onChange,
}: {
  value: number;
  disabled?: boolean;
  onChange: (n: number) => void;
}) {
  const current = clampNotch(value);

  const key = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      onChange(current - 1);
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      onChange(current + 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      onChange(MIN_NOTCH);
    } else if (e.key === "End") {
      e.preventDefault();
      onChange(MAX_NOTCH);
    }
  };

  return (
    <div data-testid="nw-size-notch">
      <div className="flex items-baseline justify-between">
        <span className="nw-label">Size &amp; attention</span>
        <span className="text-[11px] text-muted-foreground">{NOTCH_LABELS[current]}</span>
      </div>

      <div
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label="Size and attention"
        aria-valuemin={MIN_NOTCH}
        aria-valuemax={MAX_NOTCH}
        aria-valuenow={current}
        aria-valuetext={NOTCH_LABELS[current]}
        aria-disabled={disabled}
        onKeyDown={key}
        className={`mt-2 flex items-center gap-1 rounded-xl border border-border/60 bg-card/40 p-1.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
          disabled ? "opacity-45" : ""
        }`}
      >
        {NOTCHES.map((n) => {
          const active = n === current;
          return (
            <button
              key={n}
              type="button"
              disabled={disabled}
              data-notch={n}
              aria-label={NOTCH_LABELS[n]}
              aria-pressed={active}
              onClick={() => onChange(n)}
              className={`relative h-8 flex-1 rounded-lg border text-[10px] tracking-wide transition-colors ${
                active
                  ? "border-primary/70 bg-primary/20 text-foreground"
                  : "border-border/50 bg-card/30 text-muted-foreground hover:bg-accent/20"
              }`}
            >
              <span
                aria-hidden
                className="mx-auto block rounded-full bg-current"
                style={{ width: 4 + (Math.abs(n) + (n > 0 ? 3 : 0)) * 2, height: 4 }}
              />
            </button>
          );
        })}
      </div>

      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>Smaller</span>
        <span>Recommended</span>
        <span>Larger</span>
      </div>
    </div>
  );
}
