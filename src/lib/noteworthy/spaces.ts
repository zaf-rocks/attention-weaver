/**
 * Multiple independent spaces. The ACTIVE space always lives at the main key
 * (so existing backup/migration paths keep working); inactive spaces are
 * parked under their own keys. Utilities (repository + corkboard) are shared.
 */
export const SPACES_KEY = "noteworthy.spaces.v1";
export const spaceKey = (id: string) => `noteworthy.space.${id}`;

export type SpaceMeta = { id: string; name: string };
export type SpacesRegistry = { active: string; list: SpaceMeta[] };

export const DEFAULT_REGISTRY: SpacesRegistry = { active: "main", list: [{ id: "main", name: "Main" }] };

export function readRegistry(): SpacesRegistry {
  if (typeof window === "undefined") return DEFAULT_REGISTRY;
  try {
    const raw = JSON.parse(localStorage.getItem(SPACES_KEY) ?? "null");
    if (raw && typeof raw.active === "string" && Array.isArray(raw.list) && raw.list.length) {
      const list = raw.list.filter(
        (s: unknown): s is SpaceMeta =>
          !!s && typeof (s as SpaceMeta).id === "string" && typeof (s as SpaceMeta).name === "string",
      );
      if (list.some((s: SpaceMeta) => s.id === raw.active)) return { active: raw.active, list };
    }
  } catch {
    /* fall through */
  }
  return DEFAULT_REGISTRY;
}

export function writeRegistry(r: SpacesRegistry) {
  try {
    localStorage.setItem(SPACES_KEY, JSON.stringify(r));
  } catch {
    /* non-fatal */
  }
}

/** Bundle for backups: registry + every parked (inactive) space. */
export function readSpacesBundle(): { registry: SpacesRegistry; parked: Record<string, unknown> } {
  const registry = readRegistry();
  const parked: Record<string, unknown> = {};
  for (const s of registry.list) {
    if (s.id === registry.active) continue;
    try {
      const raw = localStorage.getItem(spaceKey(s.id));
      if (raw) parked[s.id] = JSON.parse(raw);
    } catch {
      /* skip unreadable */
    }
  }
  return { registry, parked };
}

export function writeSpacesBundle(b: unknown) {
  if (!b || typeof b !== "object") return;
  const { registry, parked } = b as { registry?: unknown; parked?: Record<string, unknown> };
  if (!registry || typeof registry !== "object") return;
  writeRegistry(registry as SpacesRegistry);
  const fixed = readRegistry();
  for (const [id, v] of Object.entries(parked ?? {})) {
    if (fixed.list.some((s) => s.id === id)) localStorage.setItem(spaceKey(id), JSON.stringify(v));
  }
}
