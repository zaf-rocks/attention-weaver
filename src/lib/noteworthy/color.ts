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
type Memory = { recent: string[]; saved: GradientPair[]; last?: string };

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
