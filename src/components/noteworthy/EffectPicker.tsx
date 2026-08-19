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
  return (
    <label className="block">
      <span className="nw-label">{label}</span>
      <select
        className="nw-input mt-1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </label>
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
