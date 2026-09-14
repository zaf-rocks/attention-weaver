import { useCallback, useEffect, useRef, useState } from "react";
import type { Facet, FieldSettings, NoteworthyState, SlotId } from "./types";
import { createInitialState } from "./initial";
import { migrateState } from "./migrate";
import { MAIN_KEY, takeSnapshot } from "./backup";

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

  // Hydrate from localStorage after mount (SSR-safe).
  useEffect(() => {
    setState(load());
    hydrated.current = true;
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
  const reloadFromStorage = useCallback(() => setState(load()), []);

  return {
    state,
    savedAt,
    updateFacet,
    touchFacet,
    updateSettings,
    reset,
    reloadFromStorage,
  };
}
