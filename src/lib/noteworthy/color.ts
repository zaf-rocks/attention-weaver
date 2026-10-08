/** Color math + persistent palette memory (recent colors, saved gradients). */

export type HSVA = { h: number; s: number; v: number; a: number };

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function hexToHsva(hex: string): HSVA | null {
  const m = /^#?([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(hex.trim());
  if (!m) return null;
  const int = Number.parseInt(m[1] ?? "000000", 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;
  const a = m[2] ? Number.parseInt(m[2], 16) / 255 : 1;
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max ? (d / max) * 100 : 0, v: max * 100, a: a * 100 };
}

export function hsvaToHex({ h, s, v, a }: HSVA): string {
  const S = clamp(s, 0, 100) / 100;
  const V = clamp(v, 0, 100) / 100;
  const c = V * S;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = V - c;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  const to = (n: number) =>
    Math.round(clamp(n, 0, 1) * 255)
      .toString(16)
      .padStart(2, "0");
  const alpha = clamp(a, 0, 100) >= 99.5 ? "" : to(a / 100);
  return `#${to(r + m)}${to(g + m)}${to(b + m)}${alpha}`;
}

export type GradientPair = { name: string; a: string; b: string };

export const GRADIENT_PRESETS: GradientPair[] = [
  { name: "Deep Cosmic", a: "#1a1240", b: "#6b3cff" },
  { name: "Solar Plasma", a: "#ff5e00", b: "#ffd23f" },
  { name: "Cyber Neon", a: "#00f0ff", b: "#ff2bd6" },
  { name: "Aurora", a: "#a6ff3c", b: "#00c2b8" },
  { name: "Crimson Ember", a: "#ff1f3d", b: "#ff8a1f" },
  { name: "Glacier", a: "#d6f5ff", b: "#3a7bff" },
  { name: "Orchid Night", a: "#2b0a3d", b: "#e04dff" },
  { name: "Obsidian Gold", a: "#0b0b10", b: "#d4a64a" },
];

/** Experimental: deliberately unusual, high-contrast pairings. */
export const EXPERIMENTAL_PRESETS: GradientPair[] = [
  { name: "Chromatic Ghost", a: "#ff00a8cc", b: "#00ffd055" },
  { name: "Toxic Bloom", a: "#d4ff00", b: "#7a00ff" },
  { name: "Infrared", a: "#3d0000", b: "#ff3b00" },
  { name: "Ultraviolet Bleach", a: "#ffffff", b: "#5a00ff" },
  { name: "Oil Slick", a: "#00ff88", b: "#ff0066" },
  { name: "Void Pearl", a: "#04040a", b: "#f2e9ff" },
];

const KEY = "noteworthy.colors.v1";
type Memory = { recent: string[]; saved: (GradientPair & { stops?: string[] })[]; last?: string };

export function loadMemory(): Memory {
  if (typeof window === "undefined") return { recent: [], saved: [] };
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    return {
      recent: Array.isArray(raw.recent) ? raw.recent.filter((x: unknown) => typeof x === "string") : [],
      saved: Array.isArray(raw.saved) ? raw.saved : [],
      last: typeof raw.last === "string" ? raw.last : undefined,
    };
  } catch {
    return { recent: [], saved: [] };
  }
}

export function saveMemory(m: Memory) {
  try {
    localStorage.setItem(KEY, JSON.stringify(m));
  } catch {
    /* storage full — non-fatal */
  }
}

export function pushRecent(m: Memory, hex: string): Memory {
  const recent = [hex, ...m.recent.filter((c) => c.toLowerCase() !== hex.toLowerCase())].slice(0, 24);
  return { ...m, recent, last: hex };
}

/* ───────────── Spectral system ───────────── */

export type Tone = "body" | "edge" | "text";
export type SpectralPreset = { name: string; stops: string[]; group: string };

/** The seven spectral hues in order. Each has a deep (body) and a bright (edge) form. */
export const SPECTRUM = [
  { name: "Red", deep: "#3a0610", bright: "#ff2a48" },
  { name: "Orange", deep: "#3a1504", bright: "#ff7a1a" },
  { name: "Yellow", deep: "#332a04", bright: "#ffd81f" },
  { name: "Green", deep: "#06301a", bright: "#2bff7a" },
  { name: "Blue", deep: "#061a40", bright: "#2a8bff" },
  { name: "Purple", deep: "#1f0a40", bright: "#9b4dff" },
  { name: "Pink", deep: "#3a0a2c", bright: "#ff4dc4" },
] as const;

const toneOf = (i: number, tone: Tone) => {
  const s = SPECTRUM[((i % 7) + 7) % 7]!;
  return tone === "body" ? s.deep : s.bright;
};

const GROUPS = ["Neighbors", "One apart", "Two apart", "Three apart"];

/** Pairs by spectral distance (1 = adjacent … 4 = wide), in deep or bright tones. */
export function spectralPairs(tone: Tone): SpectralPreset[] {
  const out: SpectralPreset[] = [];
  for (let d = 1; d <= 4; d++) {
    for (let i = 0; i < 7; i++) {
      // distance 4 on a 7-ring mirrors distance 3; keep both for full coverage
      out.push({
        name: `${SPECTRUM[i]!.name} + ${SPECTRUM[(i + d) % 7]!.name}`,
        stops: [toneOf(i, tone), toneOf(i + d, tone)],
        group: GROUPS[d - 1] ?? "Wide",
      });
    }
  }
  return out;
}

/** Experimental: 3+ color spectral ribbons. */
export function experimentalPresets(tone: Tone): SpectralPreset[] {
  const seq = (name: string, idx: number[]): SpectralPreset => ({
    name,
    stops: idx.map((i) => toneOf(i, tone)),
    group: "Experimental",
  });
  return [
    seq("Ember Rise", [0, 1, 2]),
    seq("Canopy", [2, 3, 4]),
    seq("Deep Tide", [3, 4, 5]),
    seq("Twilight", [4, 5, 6]),
    seq("Sunset Fan", [5, 6, 0, 1]),
    seq("Aurora", [3, 4, 5, 6]),
    seq("Oil Slick", [5, 3, 6, 4]),
    seq("Prism", [0, 2, 4, 6]),
    seq("Full Spectrum", [0, 1, 2, 3, 4, 5, 6]),
  ];
}

export const gradientCss = (stops: string[], deg = 90) => `linear-gradient(${deg}deg, ${stops.join(", ")})`;

/* ───────────── Saved gradients (all tones) ───────────── */

export type SavedGradient = { name: string; stops: string[] };
export const savedStops = (p: GradientPair & { stops?: string[] }) =>
  p.stops && p.stops.length >= 2 ? p.stops : [p.a, p.b];

/* ───────────── Marks (user-defined symbols) ───────────── */

const MARK_KEY = "noteworthy.marks.v1";
/** A small, deliberate starter set — everything else is the user's own. */
export const STARTER_MARKS = ["✦", "◈", "⬡", "◉", "△", "🎯", "⚡", "🧠", "💎", "🔥"];

export function loadMarks(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(MARK_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((x: unknown) => typeof x === "string") : [];
  } catch {
    return [];
  }
}
export function saveMarks(list: string[]) {
  try {
    localStorage.setItem(MARK_KEY, JSON.stringify(list.slice(0, 60)));
  } catch {
    /* non-fatal */
  }
}
