import type { Facet, NoteworthyState, SlotId } from "./types";

export const POSITION_NAMES: Record<SlotId, string> = {
  UTIL_TOP: "Upper Utility Bar",
  TFL: "Top Far Left",
  TL: "Top Left",
  TC: "Top Center",
  TR: "Top Right",
  TFR: "Top Far Right",
  UL: "Upper Left of Center",
  LL: "Lower Left of Center",
  C: "Center",
  UR: "Upper Right of Center",
  LR: "Lower Right of Center",
  BFL: "Bottom Far Left",
  BL: "Bottom Left",
  BC: "Bottom Center",
  BR: "Bottom Right",
  BFR: "Bottom Far Right",
  UTIL_BOTTOM: "Lower Utility Bar",
};

type Seed = {
  id: SlotId;
  title: string;
  tagline: string;
  icon: string;
  weight: number;
  body: [string, string];
  perimeter: [string, string];
  effect: string;
  utility?: boolean;
};

/** Spectral progression around the field — no two neighbours share a hue. */
const SEEDS: Seed[] = [
  {
    id: "UTIL_TOP",
    title: "Prompt Repository",
    tagline: "Clipboard · prompts · alarms",
    icon: "◈",
    weight: 0,
    body: ["#0b1220", "#131a2e"],
    perimeter: ["#5ef2ff", "#8b6bff"],
    effect: "marquee",
    utility: true,
  },
  {
    id: "TFL",
    title: "Ideas",
    tagline: "Loose sparks",
    icon: "✦",
    weight: 35,
    body: ["#2a0d18", "#12060f"],
    perimeter: ["#ff2d55", "#ff7a18"],
    effect: "breathe",
  },
  {
    id: "TL",
    title: "Research",
    tagline: "Open threads",
    icon: "◎",
    weight: 50,
    body: ["#2a1606", "#120a05"],
    perimeter: ["#ff7a18", "#ffd166"],
    effect: "prismatic",
  },
  {
    id: "TC",
    title: "Planning",
    tagline: "Next horizon",
    icon: "△",
    weight: 70,
    body: ["#2a2606", "#0f1005"],
    perimeter: ["#ffd166", "#a8ff3e"],
    effect: "marquee",
  },
  {
    id: "TR",
    title: "Learning",
    tagline: "In progress",
    icon: "❖",
    weight: 50,
    body: ["#0a2413", "#04120a"],
    perimeter: ["#a8ff3e", "#2bffc6"],
    effect: "glint",
  },
  {
    id: "TFR",
    title: "Follow-Up",
    tagline: "Awaiting reply",
    icon: "↻",
    weight: 35,
    body: ["#03221f", "#020f10"],
    perimeter: ["#2bffc6", "#37d6ff"],
    effect: "pulse",
  },
  {
    id: "UL",
    title: "Creative Work",
    tagline: "Deep making",
    icon: "◐",
    weight: 90,
    body: ["#1c0a2a", "#0b0416"],
    perimeter: ["#c04bff", "#ff2d55"],
    effect: "aura",
  },
  {
    id: "LL",
    title: "Communication",
    tagline: "Signal traffic",
    icon: "≋",
    weight: 90,
    body: ["#04182b", "#020c17"],
    perimeter: ["#37d6ff", "#6a5bff"],
    effect: "datastream",
  },
  {
    id: "C",
    title: "Primary Focus",
    tagline: "Everything else orbits this",
    icon: "◉",
    weight: 160,
    body: ["#0a1930", "#170a2b"],
    perimeter: ["#5ef2ff", "#c04bff"],
    effect: "shockwave",
  },
  {
    id: "UR",
    title: "Documentation",
    tagline: "Capture the record",
    icon: "▤",
    weight: 90,
    body: ["#0d1030", "#050718"],
    perimeter: ["#6a5bff", "#2bffc6"],
    effect: "nodes",
  },
  {
    id: "LR",
    title: "Administration",
    tagline: "Keeps it running",
    icon: "⬡",
    weight: 90,
    body: ["#231033", "#0d0619"],
    perimeter: ["#ff5bd0", "#8b6bff"],
    effect: "electric",
  },
  {
    id: "BFL",
    title: "Future Projects",
    tagline: "Not yet, but soon",
    icon: "⌬",
    weight: 35,
    body: ["#2b0620", "#130310"],
    perimeter: ["#ff2d55", "#c04bff"],
    effect: "embers",
  },
  {
    id: "BL",
    title: "Home",
    tagline: "Quiet infrastructure",
    icon: "⌂",
    weight: 50,
    body: ["#062820", "#02110e"],
    perimeter: ["#2bffc6", "#a8ff3e"],
    effect: "breathe",
  },
  {
    id: "BC",
    title: "Health",
    tagline: "Non-negotiable",
    icon: "❤",
    weight: 70,
    body: ["#2a0710", "#120309"],
    perimeter: ["#ff2d55", "#ffd166"],
    effect: "pulse",
  },
  {
    id: "BR",
    title: "Finance",
    tagline: "Under review",
    icon: "◇",
    weight: 50,
    body: ["#07202b", "#020f14"],
    perimeter: ["#37d6ff", "#5ef2ff"],
    effect: "lasers",
  },
  {
    id: "BFR",
    title: "Maintenance",
    tagline: "Slow burn",
    icon: "⚙",
    weight: 35,
    body: ["#16112b", "#080615"],
    perimeter: ["#8b6bff", "#37d6ff"],
    effect: "glitch",
  },
  {
    id: "UTIL_BOTTOM",
    title: "Capture Dock",
    tagline: "Autosaving quick capture",
    icon: "▣",
    weight: 0,
    body: ["#0b1220", "#131a2e"],
    perimeter: ["#c04bff", "#5ef2ff"],
    effect: "rotate",
    utility: true,
  },
];

const makeFacet = (s: Seed): Facet => ({
  id: s.id,
  utility: Boolean(s.utility),
  title: s.title,
  tagline: s.tagline,
  overview:
    "Editable overview. Describe why this occupies space in the field and what changes when it is resolved.",
  icon: s.icon,
  tasks: [
    { id: `${s.id}-t1`, text: "Define the next concrete step", done: false },
    { id: `${s.id}-t2`, text: "Review supporting material", done: false },
  ],
  notes: "",
  weight: s.weight,
  notch: 0,
  locked: true,
  complete: false,
  lastAccessed: new Date().toISOString(),
  due: "",
  reminders: [],
  body: { a: s.body[0], b: s.body[1] },
  perimeter: { a: s.perimeter[0], b: s.perimeter[1] },
  perimeterEffect: s.effect,
  glow: 55,
  motion: 45,
  effectSpeed: 45,
});

export const ORDER: SlotId[] = SEEDS.map((s) => s.id);

export function createInitialState(): NoteworthyState {
  const facets = {} as Record<SlotId, Facet>;
  for (const s of SEEDS) facets[s.id] = makeFacet(s);
  return {
    version: 2,
    facets,
    settings: {
      reducedMotion: false,
      ambientMotion: 45,
      fieldEffect: "constellation",
      depth: 60,
    },
  };
}
