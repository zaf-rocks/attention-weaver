import { useCallback, useEffect, useRef, useState } from "react";
import type { Facet, FieldSettings, NoteworthyState, SlotId } from "./types";
import { createInitialState } from "./initial";
import {
  NOTCH_STEP,
  RECOMMENDED,
  clampNotch,
  normalizeFromNotches,
  setNotch as engineSetNotch,
} from "./weight";

const KEY = "noteworthy.v1";

function load(): NoteworthyState {
  const base = createInitialState();
  if (typeof window === "undefined") return base;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<NoteworthyState>;
    if (!parsed || !parsed.facets) return base;

    // Merge so newly added fields always exist, then migrate legacy weights.
    const facets = { ...base.facets };
    for (const id of Object.keys(base.facets) as SlotId[]) {
      const stored = parsed.facets?.[id];
      if (!stored) continue;
      const merged = { ...base.facets[id], ...stored };
      // Legacy state stored continuous percentages and no notch: derive one.
      const notch =
        typeof stored.notch === "number"
          ? clampNotch(stored.notch)
          : clampNotch(Math.round((merged.weight - RECOMMENDED[id]) / NOTCH_STEP));
      const locked = typeof stored.locked === "boolean" ? stored.locked : true;
      facets[id] = { ...merged, notch: merged.utility ? 0 : notch, locked };
    }

    return {
      version: base.version,
      facets: normalizeFromNotches(facets),
      settings: { ...base.settings, ...parsed.settings },
    };
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

  const [notice, setNotice] = useState<string | null>(null);

  const setNotch = useCallback((id: SlotId, notch: number) => {
    setState((s) => {
      const result = engineSetNotch(s.facets, id, notch);
      if (!result.changed) {
        setNotice(
          result.reason === "no-donors"
            ? "Unlock at least one other facet to redistribute attention."
            : result.reason === "locked"
              ? "Unlock this facet to adjust its size."
              : "No further attention is available in that direction.",
        );
        return s;
      }
      setNotice(
        result.reason === "soft-stop"
          ? "Stopped early — eligible facets reached their limits."
          : null,
      );
      return { ...s, facets: result.facets };
    });
  }, []);

  const updateSettings = useCallback((patch: Partial<FieldSettings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  const reset = useCallback(() => setState(createInitialState()), []);

  return { state, updateFacet, touchFacet, setNotch, notice, setNotice, updateSettings, reset };
}
