import type { EffectOption } from "@/lib/noteworthy/effects";

export function EffectPicker({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: EffectOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  const current = options.find((o) => o.id === value);
  return (
    <div role="radiogroup" aria-label={label}>
      <span className="nw-label">{label}</span>
      <div className="nw-scroll-x mt-1 flex gap-1.5 pb-1">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={o.id === value}
            title={o.hint}
            onClick={() => onChange(o.id)}
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] whitespace-nowrap transition-colors ${
              o.id === value
                ? "border-primary bg-primary/15 text-primary"
                : "border-border/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            {o.name}
          </button>
        ))}
      </div>
      {current?.hint && <p className="mt-0.5 text-[10px] text-muted-foreground">{current.hint}</p>}
    </div>
  );
}

export function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  suffix = "",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <label className="block">
      <span className="nw-label flex justify-between">
        <span>{label}</span>
        <span className="text-foreground">
          {value}
          {suffix}
        </span>
      </span>
      <input
        type="range"
        className="mt-1 w-full accent-[var(--primary)]"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
      />
    </label>
  );
}

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-2 py-1.5">
      <span className="nw-label">{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-6 w-10 cursor-pointer rounded border-0 bg-transparent"
        aria-label={label}
      />
    </label>
  );
}
