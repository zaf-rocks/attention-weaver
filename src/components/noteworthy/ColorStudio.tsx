import { useEffect, useRef, useState } from "react";
import {
  experimentalPresets,
  gradientCss,
  hexToHsva,
  hsvaToHex,
  loadMemory,
  pushRecent,
  savedStops,
  saveMemory,
  spectralPairs,
  type HSVA,
  type Tone,
} from "@/lib/noteworthy/color";
import type { Gradient } from "@/lib/noteworthy/types";
import { HoldDelete } from "./HoldDelete";

type Memory = ReturnType<typeof loadMemory>;

const stopsOf = (g: Gradient) => (g.stops && g.stops.length >= 3 ? g.stops : [g.a, g.b]);
const fromStops = (stops: string[]): Gradient =>
  stops.length >= 3
    ? { a: stops[0]!, b: stops[stops.length - 1]!, stops }
    : { a: stops[0]!, b: stops[1] ?? stops[0]! };

/**
 * Gradient editor for one surface. Tone decides the preset family:
 * body = deep spectral tones, edge/text = bright spectral tones.
 * Every stop is editable; picker remembers hue at black.
 */
export function ColorStudio({
  tone,
  value,
  onChange,
}: {
  tone: Tone;
  value: Gradient;
  onChange: (g: Gradient) => void;
}) {
  const stops = stopsOf(value);
  const [idx, setIdx] = useState(0);
  const sel = Math.min(idx, stops.length - 1);
  const [mem, setMem] = useState<Memory>({ recent: [], saved: [] });
  useEffect(() => setMem(loadMemory()), []);
  const update = (m: Memory) => {
    setMem(m);
    saveMemory(m);
  };

  const setColor = (hex: string) => {
    const next = [...stops];
    next[sel] = hex;
    onChange(fromStops(next));
  };
  const commitRecent = (hex: string) => update(pushRecent(loadMemory(), hex));
  const apply = (s: string[]) => {
    onChange(fromStops(s));
    setIdx(0);
  };

  const saveCurrent = () => {
    const m = loadMemory();
    const name = `Mine ${m.saved.length + 1}`;
    update({ ...m, saved: [{ name, a: stops[0]!, b: stops[stops.length - 1]!, stops }, ...m.saved].slice(0, 30) });
  };
  const removeSaved = (i: number) => {
    const m = loadMemory();
    update({ ...m, saved: m.saved.filter((_, j) => j !== i) });
  };

  const pairs = spectralPairs(tone);
  const groups = Array.from(new Set(pairs.map((p) => p.group)));

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        {stops.map((c, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            aria-pressed={sel === i}
            aria-label={`Edit color ${i + 1}`}
            className={`nw-checker h-7 w-7 shrink-0 rounded-full border-2 ${
              sel === i ? "border-primary" : "border-border/60"
            }`}
          >
            <span className="block h-full w-full rounded-full" style={{ background: c }} />
          </button>
        ))}
        <div className="ml-1 h-4 flex-1 rounded-full border border-border/60" style={{ background: gradientCss(stops) }} aria-hidden />
      </div>

      <HsvPicker key={sel} hex={stops[sel]!} onChange={setColor} onCommit={commitRecent} />

      {mem.recent.length > 0 && (
        <Row title="Recent">
          {mem.recent.map((c) => (
            <Swatch key={c} color={c} onClick={() => { setColor(c); commitRecent(c); }} />
          ))}
        </Row>
      )}

      {groups.map((g) => (
        <Row key={g} title={g}>
          {pairs.filter((p) => p.group === g).map((p) => (
            <Bead key={p.name} name={p.name} stops={p.stops} onClick={() => apply(p.stops)} />
          ))}
        </Row>
      ))}
      <Row title="Experimental · 3+ colors">
        {experimentalPresets(tone).map((p) => (
          <Bead key={p.name} name={p.name} stops={p.stops} wide onClick={() => apply(p.stops)} />
        ))}
      </Row>
      <Row title="My gradients · hold ✕ to delete">
        <button
          onClick={saveCurrent}
          className="h-5 shrink-0 rounded-full border border-dashed border-primary/70 px-2 text-[10px] text-primary"
        >
          + Save
        </button>
        {mem.saved.map((p, i) => (
          <span key={`${p.name}-${i}`} className="relative flex shrink-0 items-center gap-0.5">
            <Bead name={p.name} stops={savedStops(p)} onClick={() => apply(savedStops(p))} />
            <HoldDelete label={`Delete ${p.name}`} onDelete={() => removeSaved(i)} />
          </span>
        ))}
      </Row>
    </div>
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
      <span className="text-[9px] tracking-wide text-muted-foreground uppercase">{title}</span>
      <div className="nw-scroll-x mt-0.5 flex items-center gap-1 pb-0.5">{children}</div>
    </div>
  );
}

function Swatch({ color, onClick }: { color: string; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label={`Use ${color}`} className="nw-checker h-5 w-5 shrink-0 rounded-full border border-border/60">
      <span className="block h-full w-full rounded-full" style={{ background: color }} />
    </button>
  );
}

function Bead({ name, stops, wide, onClick }: { name: string; stops: string[]; wide?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={name}
      aria-label={`Apply ${name}`}
      className={`h-5 shrink-0 rounded-full border border-border/60 ${wide ? "w-10" : "w-7"}`}
      style={{ background: gradientCss(stops) }}
    />
  );
}
