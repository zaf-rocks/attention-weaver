import { useEffect, useRef, useState } from "react";
import {
  EXPERIMENTAL_PRESETS,
  GRADIENT_PRESETS,
  hexToHsva,
  hsvaToHex,
  loadMemory,
  pushRecent,
  saveMemory,
  type GradientPair,
  type HSVA,
} from "@/lib/noteworthy/color";
import type { Gradient } from "@/lib/noteworthy/types";

type Memory = ReturnType<typeof loadMemory>;

/**
 * Gradient editor for one surface (body or perimeter): endpoint A/B swatches,
 * an HSB+alpha picker that never resets (hue survives black/gray), recent
 * colors, curated + experimental presets and user-saved gradients.
 */
export function ColorStudio({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Gradient;
  onChange: (g: Gradient) => void;
}) {
  const [end, setEnd] = useState<"a" | "b">("a");
  const [mem, setMem] = useState<Memory>({ recent: [], saved: [] });
  useEffect(() => setMem(loadMemory()), []);

  const update = (m: Memory) => {
    setMem(m);
    saveMemory(m);
  };

  const setColor = (hex: string) => onChange({ ...value, [end]: hex });
  const commitRecent = (hex: string) => update(pushRecent(loadMemory(), hex));

  const applyPair = (p: GradientPair) => {
    onChange({ a: p.a, b: p.b });
    update(pushRecent(pushRecent(loadMemory(), p.a), p.b));
  };

  const saveCurrent = () => {
    const m = loadMemory();
    const name = `Saved ${m.saved.length + 1}`;
    update({ ...m, saved: [{ name, a: value.a, b: value.b }, ...m.saved].slice(0, 16) });
  };
  const removeSaved = (i: number) => {
    const m = loadMemory();
    update({ ...m, saved: m.saved.filter((_, j) => j !== i) });
  };

  return (
    <section className="space-y-2 rounded-xl border border-border/60 bg-card/40 p-2">
      <div className="flex items-center gap-2">
        <span className="nw-label">{label}</span>
        <div
          className="ml-auto h-4 w-20 rounded-full border border-border/60"
          style={{ background: `linear-gradient(90deg, ${value.a}, ${value.b})` }}
          aria-hidden
        />
      </div>

      <div className="flex gap-1.5">
        {(["a", "b"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setEnd(k)}
            aria-pressed={end === k}
            className={`flex flex-1 items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] ${
              end === k ? "border-primary text-foreground" : "border-border/60 text-muted-foreground"
            }`}
          >
            <span className="nw-checker h-4 w-4 rounded-full border border-border/60">
              <span className="block h-full w-full rounded-full" style={{ background: value[k] }} />
            </span>
            Endpoint {k.toUpperCase()}
          </button>
        ))}
      </div>

      <HsvPicker key={end} hex={value[end]} onChange={setColor} onCommit={commitRecent} />

      {mem.recent.length > 0 && (
        <Row title="Recent">
          {mem.recent.map((c) => (
            <Swatch key={c} color={c} onClick={() => { setColor(c); commitRecent(c); }} />
          ))}
        </Row>
      )}

      <Row title="Presets">
        {GRADIENT_PRESETS.map((p) => <Pair key={p.name} p={p} onClick={() => applyPair(p)} />)}
      </Row>
      <Row title="Experimental">
        {EXPERIMENTAL_PRESETS.map((p) => <Pair key={p.name} p={p} onClick={() => applyPair(p)} />)}
      </Row>
      <Row title="My gradients">
        <button
          onClick={saveCurrent}
          className="h-6 shrink-0 rounded-full border border-dashed border-primary/70 px-2 text-[10px] text-primary"
        >
          + Save current
        </button>
        {mem.saved.map((p, i) => (
          <span key={`${p.name}-${i}`} className="relative shrink-0">
            <Pair p={p} onClick={() => applyPair(p)} />
            <button
              onClick={() => removeSaved(i)}
              aria-label={`Delete ${p.name}`}
              className="absolute -top-1 -right-1 grid h-3.5 w-3.5 place-items-center rounded-full bg-card text-[8px] text-muted-foreground"
            >
              ✕
            </button>
          </span>
        ))}
      </Row>
    </section>
  );
}

function HsvPicker({
  hex,
  onChange,
  onCommit,
}: {
  hex: string;
  onChange: (hex: string) => void;
  onCommit: (hex: string) => void;
}) {
  // Local HSVA is the source of truth while editing, so hue/saturation are
  // never lost when brightness hits 0 (hex alone can't remember them).
  const [c, setC] = useState<HSVA>(() => hexToHsva(hex) ?? { h: 200, s: 70, v: 80, a: 100 });
  const emitted = useRef(hex);
  const [text, setText] = useState(hex);

  useEffect(() => {
    if (hex.toLowerCase() === emitted.current.toLowerCase()) return;
    const next = hexToHsva(hex);
    if (next) setC((prev) => ({ ...next, h: next.s === 0 || next.v === 0 ? prev.h : next.h }));
    emitted.current = hex;
    setText(hex);
  }, [hex]);

  const set = (patch: Partial<HSVA>) => {
    const next = { ...c, ...patch };
    setC(next);
    const out = hsvaToHex(next);
    emitted.current = out;
    setText(out);
    onChange(out);
  };
  const commit = () => onCommit(emitted.current);

  const pure = hsvaToHex({ h: c.h, s: 100, v: 100, a: 100 });
  const solid = hsvaToHex({ ...c, a: 100 });
  const tracks = {
    h: "linear-gradient(90deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)",
    s: `linear-gradient(90deg, ${hsvaToHex({ ...c, s: 0, a: 100 })}, ${hsvaToHex({ ...c, s: 100, a: 100 })})`,
    v: `linear-gradient(90deg, #000, ${hsvaToHex({ ...c, v: 100, a: 100 })})`,
    a: `linear-gradient(90deg, transparent, ${solid})`,
  };

  return (
    <div className="space-y-1.5">
      <Track label="Hue" value={c.h} max={360} bg={tracks.h} onChange={(h) => set({ h })} onCommit={commit} />
      <Track label="Saturation" value={c.s} max={100} bg={tracks.s} onChange={(s) => set({ s })} onCommit={commit} />
      <Track label="Brightness" value={c.v} max={100} bg={tracks.v} onChange={(v) => set({ v })} onCommit={commit} />
      <Track label="Opacity" value={c.a} max={100} bg={tracks.a} checker onChange={(a) => set({ a })} onCommit={commit} />
      <div className="flex items-center gap-2">
        <span className="h-6 w-6 shrink-0 rounded-md border border-border/60" style={{ background: pure }} aria-hidden />
        <input
          className="nw-input h-7 font-mono text-[11px]"
          value={text}
          aria-label="Hex color"
          onChange={(e) => {
            setText(e.target.value);
            const next = hexToHsva(e.target.value);
            if (next) {
              setC(next);
              const out = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
              emitted.current = out;
              onChange(out);
            }
          }}
          onBlur={commit}
        />
      </div>
    </div>
  );
}

function Track({
  label,
  value,
  max,
  bg,
  checker,
  onChange,
  onCommit,
}: {
  label: string;
  value: number;
  max: number;
  bg: string;
  checker?: boolean;
  onChange: (n: number) => void;
  onCommit: () => void;
}) {
  return (
    <label className="block">
      <span className="flex justify-between text-[10px] text-muted-foreground">
        <span>{label}</span>
        <span className="font-mono text-foreground">{Math.round(value)}</span>
      </span>
      <span className={`relative mt-0.5 block h-4 rounded-full ${checker ? "nw-checker" : ""}`}>
        <span className="absolute inset-0 rounded-full" style={{ background: bg }} aria-hidden />
        <input
          type="range"
          min={0}
          max={max}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onPointerUp={onCommit}
          onKeyUp={onCommit}
          aria-label={label}
          className="nw-track absolute inset-0 w-full"
        />
      </span>
    </label>
  );
}

function Row({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-[10px] text-muted-foreground">{title}</span>
      <div className="nw-scroll-x mt-0.5 flex items-center gap-1.5 pb-1">{children}</div>
    </div>
  );
}

function Swatch({ color, onClick }: { color: string; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label={`Use ${color}`} className="nw-checker h-6 w-6 shrink-0 rounded-full border border-border/60">
      <span className="block h-full w-full rounded-full" style={{ background: color }} />
    </button>
  );
}

function Pair({ p, onClick }: { p: GradientPair; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={p.name}
      aria-label={`Apply ${p.name}`}
      className="h-6 w-12 shrink-0 rounded-full border border-border/60"
      style={{ background: `linear-gradient(90deg, ${p.a}, ${p.b})` }}
    />
  );
}
