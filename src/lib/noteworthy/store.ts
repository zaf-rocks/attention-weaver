import { useCallback, useEffect, useRef, useState } from "react";
import type { Facet, FieldSettings, NoteworthyState, SlotId } from "./types";
import { createInitialState } from "./initial";
import { migrateState } from "./migrate";
import { MAIN_KEY, takeSnapshot } from "./backup";
import { readRegistry, spaceKey, writeRegistry, type SpacesRegistry } from "./spaces";

function load(): NoteworthyState {
  if (typeof window === "undefined") return createInitialState();
  try {
    const raw = window.localStorage.getItem(MAIN_KEY);
    if (!raw) return createInitialState();
    return migrateState(JSON.parse(raw));
  } catch {
    return createInitialState();
  }
}

export function useNoteworthy() {
  const [state, setState] = useState<NoteworthyState>(() => createInitialState());
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const hydrated = useRef(false);
  const [spaces, setSpaces] = useState<SpacesRegistry>(() => ({ active: "main", list: [{ id: "main", name: "Main" }] }));

  // Hydrate from localStorage after mount (SSR-safe).
  useEffect(() => {
    setState(load());
    setSpaces(readRegistry());
    hydrated.current = true;
  }, []);

  const commitSpaces = (r: SpacesRegistry) => {
    writeRegistry(r);
    setSpaces(r);
  };

  /** Park the active space, then load the target into the main slot. */
  const switchSpace = useCallback(
    (id: string) => {
      const r = readRegistry();
      if (id === r.active || !r.list.some((s) => s.id === id)) return;
      try {
        localStorage.setItem(spaceKey(r.active), localStorage.getItem(MAIN_KEY) ?? JSON.stringify(state));
        const raw = localStorage.getItem(spaceKey(id));
        const next = raw ? migrateState(JSON.parse(raw)) : createInitialState();
        localStorage.removeItem(spaceKey(id));
        localStorage.setItem(MAIN_KEY, JSON.stringify(next));
        commitSpaces({ ...r, active: id });
        setState(next);
      } catch {
        /* leave current space untouched on failure */
      }
    },
    [state],
  );

  const createSpace = useCallback((name: string) => {
    const r = readRegistry();
    const id = `s${Date.now().toString(36)}`;
    commitSpaces({ ...r, list: [...r.list, { id, name: name.trim() || `Space ${r.list.length + 1}` }] });
    return id;
  }, []);

  const renameSpace = useCallback((id: string, name: string) => {
    const r = readRegistry();
    commitSpaces({ ...r, list: r.list.map((s) => (s.id === id ? { ...s, name } : s)) });
  }, []);

  /** Only inactive spaces can be deleted; a recovery snapshot is taken first. */
  const deleteSpace = useCallback((id: string) => {
    const r = readRegistry();
    if (id === r.active || r.list.length <= 1) return;
    takeSnapshot("before deleting a space");
    localStorage.removeItem(spaceKey(id));
    commitSpaces({ ...r, list: r.list.filter((s) => s.id !== id) });
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(MAIN_KEY, JSON.stringify(state));
      setSavedAt(new Date().toISOString());
    } catch {
      /* storage unavailable */
    }
  }, [state]);

  const updateFacet = useCallback((id: SlotId, patch: Partial<Facet>) => {
    setState((s) => ({ ...s, facets: { ...s.facets, [id]: { ...s.facets[id], ...patch } } }));
  }, []);

  /**
   * Trade the full content of two primary facets. Identity (slot id, utility
   * flag, position name) stays put — only the user's content moves. A
   * recovery snapshot is taken first so the trade can be undone.
   */
  const swapFacets = useCallback((a: SlotId, b: SlotId) => {
    if (a === b) return;
    takeSnapshot("before trading facets");
    setState((s) => {
      const fa = s.facets[a];
      const fb = s.facets[b];
      if (!fa || !fb || fa.utility || fb.utility) return s;
      const keep = (f: Facet) => ({ id: f.id, utility: f.utility, positionName: f.positionName });
      return {
        ...s,
        facets: { ...s.facets, [a]: { ...fb, ...keep(fa) }, [b]: { ...fa, ...keep(fb) } },
      };
    });
  }, []);

  const touchFacet = useCallback((id: SlotId) => {
    setState((s) => ({
      ...s,
      facets: { ...s.facets, [id]: { ...s.facets[id], lastAccessed: new Date().toISOString() } },
    }));
  }, []);

  const updateSettings = useCallback((patch: Partial<FieldSettings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  /** Destructive: always snapshot first so Restore Last Recovery can undo it. */
  const reset = useCallback(() => {
    takeSnapshot("before reset");
    setState(createInitialState());
  }, []);

  /** Re-read localStorage after an import or recovery restore. */
  const reloadFromStorage = useCallback(() => {
    setState(load());
    setSpaces(readRegistry());
  }, []);

  return {
    state,
    savedAt,
    updateFacet,
    swapFacets,
    touchFacet,
    updateSettings,
    reset,
    reloadFromStorage,
    spaces,
    switchSpace,
    createSpace,
    renameSpace,
    deleteSpace,
  };
}
