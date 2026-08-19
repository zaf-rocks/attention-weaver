import { useCallback, useEffect, useRef, useState } from "react";
import type { Facet, FieldSettings, NoteworthyState, SlotId } from "./types";
import { createInitialState } from "./initial";
import { setWeight as engineSetWeight } from "./weight";

const KEY = "noteworthy.v1";

function load(): NoteworthyState {
  const base = createInitialState();
  if (typeof window === "undefined") return base;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as NoteworthyState;
    if (!parsed || parsed.version !== base.version) return base;
    // Merge so newly added fields always exist.
    const facets = { ...base.facets };
    for (const id of Object.keys(base.facets) as SlotId[]) {
      const stored = parsed.facets?.[id];
      if (stored) facets[id] = { ...base.facets[id], ...stored };
    }
    return { version: base.version, facets, settings: { ...base.settings, ...parsed.settings } };
  } catch {
    return base;
  }
}

export function useNoteworthy() {
  const [state, setState] = useState<NoteworthyState>(() => createInitialState());
  const hydrated = useRef(false);

  // Hydrate from localStorage after mount (SSR-safe).
  useEffect(() => {
    setState(load());
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
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

  const setWeight = useCallback((id: SlotId, tenths: number) => {
    setState((s) => ({ ...s, facets: engineSetWeight(s.facets, id, tenths) }));
  }, []);

  const updateSettings = useCallback((patch: Partial<FieldSettings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  const reset = useCallback(() => setState(createInitialState()), []);

  return { state, updateFacet, touchFacet, setWeight, updateSettings, reset };
}
