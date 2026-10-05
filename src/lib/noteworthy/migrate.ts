import type { Facet, NoteworthyState, SlotId, Task } from "./types";
import { normalizeBody, normalizePerimeter } from "./effects";
import { POSITION_NAMES, STATE_VERSION, createInitialState } from "./initial";

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);

/**
 * Deterministically merge the legacy `tagline` + `overview` pair into one
 * description. Nothing the user typed is ever discarded: distinct non-empty
 * parts are kept in a stable order, separated by a blank line.
 */
export function mergeDescription(
  description: unknown,
  tagline: unknown,
  overview: unknown,
): string {
  if (typeof description === "string" && description.trim()) return description;
  const parts: string[] = [];
  for (const part of [tagline, overview]) {
    const text = typeof part === "string" ? part.trim() : "";
    if (text && !parts.includes(text)) parts.push(text);
  }
  return parts.join("\n\n");
}

function migrateTask(raw: unknown, index: number, prefix: string, depth = 0): Task | null {
  if (!isObject(raw)) return null;
  const text = str(raw.text);
  const id = str(raw.id) || `${prefix}-t${index}`;
  const subtasks =
    depth < 2 && Array.isArray(raw.subtasks)
      ? raw.subtasks
          .map((s, i) => migrateTask(s, i, `${id}-s`, depth + 1))
          .filter((t): t is Task => t !== null)
      : [];
  return { id, text, done: Boolean(raw.done), subtasks };
}

function migrateFacet(base: Facet, stored: unknown): Facet {
  if (!isObject(stored)) return base;
  const tasks = Array.isArray(stored.tasks)
    ? stored.tasks
        .map((t, i) => migrateTask(t, i, base.id))
        .filter((t): t is Task => t !== null)
    : base.tasks;

  const reminders = Array.isArray(stored.reminders)
    ? stored.reminders
        .filter(isObject)
        .map((r, i) => ({
          id: str(r.id) || `${base.id}-r${i}`,
          at: str(r.at),
          label: str(r.label, "Reminder"),
        }))
    : base.reminders;

  const body = isObject(stored.body) ? stored.body : {};
  const perimeter = isObject(stored.perimeter) ? stored.perimeter : {};
  const num = (v: unknown, fallback: number) =>
    typeof v === "number" && Number.isFinite(v) ? v : fallback;

  return {
    id: base.id,
    utility: base.utility,
    positionName: str(stored.positionName) || POSITION_NAMES[base.id],
    title: str(stored.title, base.title),
    description: mergeDescription(stored.description, stored.tagline, stored.overview) ||
      base.description,
    icon: str(stored.icon, base.icon),
    tasks,
    notes: str(stored.notes, base.notes),
    complete: Boolean(stored.complete),
    lastAccessed: str(stored.lastAccessed, base.lastAccessed),
    due: str(stored.due, base.due),
    reminders,
    body: { a: str(body.a, base.body.a), b: str(body.b, base.body.b) },
    perimeter: {
      a: str(perimeter.a, base.perimeter.a),
      b: str(perimeter.b, base.perimeter.b),
    },
    perimeterEffect: normalizePerimeter(str(stored.perimeterEffect, base.perimeterEffect)),
    bodyEffect: normalizeBody(stored.bodyEffect),
    colorShift: Boolean(stored.colorShift),
    glow: num(stored.glow, base.glow),
    motion: num(stored.motion, base.motion),
    effectSpeed: num(stored.effectSpeed, base.effectSpeed),
  };
}

/**
 * Accepts any previously persisted shape (including v1/v2 states that carried
 * weight / notch / locked) and produces a current, fixed-field state. Weight
 * data is simply dropped: geometry is now immutable.
 */
export function migrateState(raw: unknown): NoteworthyState {
  const base = createInitialState();
  if (!isObject(raw) || !isObject(raw.facets)) return base;

  const facets = {} as Record<SlotId, Facet>;
  for (const id of Object.keys(base.facets) as SlotId[]) {
    facets[id] = migrateFacet(base.facets[id], (raw.facets as Record<string, unknown>)[id]);
  }

  const settings = isObject(raw.settings) ? raw.settings : {};
  const numSetting = (v: unknown, fallback: number) =>
    typeof v === "number" && Number.isFinite(v) ? v : fallback;

  return {
    version: STATE_VERSION,
    facets,
    settings: {
      reducedMotion: Boolean(settings.reducedMotion),
      ambientMotion: numSetting(settings.ambientMotion, base.settings.ambientMotion),
      fieldEffect: str(settings.fieldEffect, base.settings.fieldEffect),
      depth: numSetting(settings.depth, base.settings.depth),
    },
  };
}
