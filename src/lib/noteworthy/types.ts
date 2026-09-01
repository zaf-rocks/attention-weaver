export type SlotId =
  | "UTIL_TOP"
  | "TFL"
  | "TL"
  | "TC"
  | "TR"
  | "TFR"
  | "UL"
  | "LL"
  | "C"
  | "UR"
  | "LR"
  | "BFL"
  | "BL"
  | "BC"
  | "BR"
  | "BFR"
  | "UTIL_BOTTOM";

export type Task = {
  id: string;
  text: string;
  done: boolean;
};

export type Reminder = {
  id: string;
  at: string; // datetime-local string
  label: string;
};

export type Gradient = {
  a: string;
  b: string;
};

export type Facet = {
  id: SlotId;
  utility: boolean;
  title: string;
  tagline: string;
  overview: string;
  icon: string;
  tasks: Task[];
  notes: string;
  weight: number; // tenths of a percent (integer), 0 for utility facets
  notch: number; // -3..+3 discrete size/attention notch, 0 = Recommended
  locked: boolean;
  complete: boolean;
  lastAccessed: string;
  due: string;
  reminders: Reminder[];
  body: Gradient;
  perimeter: Gradient;
  perimeterEffect: string;
  glow: number; // 0..100
  motion: number; // 0..100
  effectSpeed: number; // 0..100
};

export type FieldSettings = {
  reducedMotion: boolean;
  ambientMotion: number; // 0..100
  fieldEffect: string;
  depth: number; // 0..100
};

export type NoteworthyState = {
  version: number;
  facets: Record<SlotId, Facet>;
  settings: FieldSettings;
};
