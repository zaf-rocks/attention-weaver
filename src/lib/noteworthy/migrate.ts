import type { Facet, NoteworthyState, SlotId, Task } from "./types";
import { POSITION_NAMES, STATE_VERSION, createInitialState } from "./initial";

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);
const valueAt = (record: Record<string, unknown>, key: string): unknown => record[key];

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
  const parts: string[] = [];
  for (const part of [description, tagline, overview]) {
    const text = typeof part === "string" ? part.trim() : "";
    if (text && !parts.includes(text)) parts.push(text);
  }
  return parts.join("\n\n");
}

function migrateTask(raw: unknown, index: number, prefix: string, depth = 0): Task | null {
  if (!isObject(raw)) return null;
  const text = str(valueAt(raw, "text"));
  const id = str(valueAt(raw, "id")) || `${prefix}-t${index}`;
  const rawSubtasks = valueAt(raw, "subtasks");
  const subtasks =
    depth < 2 && Array.isArray(rawSubtasks)
      ? rawSubtasks
          .map((s, i) => migrateTask(s, i, `${id}-s`, depth + 1))
          .filter((t): t is Task => t !== null)
      : [];
  return { id, text, done: Boolean(valueAt(raw, "done")), subtasks };
}

function migrateFacet(base: Facet, stored: unknown): Facet {
  if (!isObject(stored)) return base;
  const storedTasks = valueAt(stored, "tasks");
  const tasks = Array.isArray(storedTasks)
    ? storedTasks.map((t, i) => migrateTask(t, i, base.id)).filter((t): t is Task => t !== null)
    : base.tasks;

  const storedReminders = valueAt(stored, "reminders");
  const reminders = Array.isArray(storedReminders)
    ? storedReminders.filter(isObject).map((r, i) => ({
        id: str(valueAt(r, "id")) || `${base.id}-r${i}`,
        at: str(valueAt(r, "at")),
        label: str(valueAt(r, "label"), "Reminder"),
      }))
    : base.reminders;

  const storedBody = valueAt(stored, "body");
  const storedPerimeter = valueAt(stored, "perimeter");
  const body = isObject(storedBody) ? storedBody : {};
  const perimeter = isObject(storedPerimeter) ? storedPerimeter : {};
  const num = (v: unknown, fallback: number) =>
    typeof v === "number" && Number.isFinite(v) ? v : fallback;

  return {
    id: base.id,
    utility: base.utility,
    positionName: str(valueAt(stored, "positionName")) || POSITION_NAMES[base.id],
    title: str(valueAt(stored, "title"), base.title),
    description:
      mergeDescription(
        valueAt(stored, "description"),
        valueAt(stored, "tagline"),
        valueAt(stored, "overview"),
      ) || base.description,
    icon: str(valueAt(stored, "icon"), base.icon),
    tasks,
    notes: str(valueAt(stored, "notes"), base.notes),
    complete: Boolean(valueAt(stored, "complete")),
    lastAccessed: str(valueAt(stored, "lastAccessed"), base.lastAccessed),
    due: str(valueAt(stored, "due"), base.due),
    reminders,
    body: {
      a: str(valueAt(body, "a"), base.body.a),
      b: str(valueAt(body, "b"), base.body.b),
    },
    perimeter: {
      a: str(valueAt(perimeter, "a"), base.perimeter.a),
      b: str(valueAt(perimeter, "b"), base.perimeter.b),
    },
    perimeterEffect: str(valueAt(stored, "perimeterEffect"), base.perimeterEffect),
    glow: num(valueAt(stored, "glow"), base.glow),
    motion: num(valueAt(stored, "motion"), base.motion),
    effectSpeed: num(valueAt(stored, "effectSpeed"), base.effectSpeed),
  };
}

/**
 * Accepts any previously persisted shape (including v1/v2 states that carried
 * weight / notch / locked) and produces a current, fixed-field state. Weight
 * data is simply dropped: geometry is now immutable.
 */
export function migrateState(raw: unknown): NoteworthyState {
  const base = createInitialState();
  if (!isObject(raw)) return base;
  const rawFacets = valueAt(raw, "facets");
  if (!isObject(rawFacets)) return base;

  const facets = {} as Record<SlotId, Facet>;
  for (const id of Object.keys(base.facets) as SlotId[]) {
    facets[id] = migrateFacet(base.facets[id], rawFacets[id]);
  }

  const rawSettings = valueAt(raw, "settings");
  const settings = isObject(rawSettings) ? rawSettings : {};
  const numSetting = (v: unknown, fallback: number) =>
    typeof v === "number" && Number.isFinite(v) ? v : fallback;

  return {
    version: STATE_VERSION,
    facets,
    settings: {
      reducedMotion: Boolean(valueAt(settings, "reducedMotion")),
      ambientMotion: numSetting(valueAt(settings, "ambientMotion"), base.settings.ambientMotion),
      fieldEffect: str(valueAt(settings, "fieldEffect"), base.settings.fieldEffect),
      depth: numSetting(valueAt(settings, "depth"), base.settings.depth),
    },
  };
}
