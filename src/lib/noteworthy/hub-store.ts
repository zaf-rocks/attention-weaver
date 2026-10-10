import { useCallback, useEffect, useRef, useState } from "react";
import type { HubEntry, HubLetter, HubState, HubTab } from "./hub-types";

export const HUB_KEY = "noteworthy.hub.v1";
export const LEGACY_UTILITY_KEY = "noteworthy.utility.v1";
export const HUB_VERSION = 1;
const HISTORY_LIMIT = 30;

export const LETTERS: HubLetter[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"];

/** Canonical letter colours. Labels are editable; letters and order are not. */
export const LETTER_SEED: Record<HubLetter, { label: string; color: string }> = {
  A: { label: "Inbox", color: "#f4f6ff" },
  B: { label: "Pink", color: "#ff8fc7" },
  C: { label: "Red", color: "#ff4d5e" },
  D: { label: "Orange", color: "#ff9a3c" },
  E: { label: "Yellow", color: "#ffd23c" },
  F: { label: "Green", color: "#57e08a" },
  G: { label: "Cyan", color: "#4fe3f0" },
  H: { label: "Blue", color: "#4f8bff" },
  I: { label: "Purple", color: "#a879ff" },
  J: { label: "Gray", color: "#98a2b3" },
  K: { label: "Black", color: "#2b2f3a" },
};

export const uid = (p: string) =>
  `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const now = () => new Date().toISOString();

export const createTabs = (): HubTab[] =>
  LETTERS.map((letter) => ({ letter, ...LETTER_SEED[letter] }));

export function createInitialHubState(): HubState {
  return {
    version: HUB_VERSION,
    tabs: createTabs(),
    entries: [],
    activeLetter: "A",
    quick: { text: "", savedAt: null },
    composer: { text: "", savedAt: null },
    history: [],
    migratedFrom: null,
  };
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, f = "") => (typeof v === "string" ? v : f);

/**
 * One-time, non-duplicating fold-in of the legacy repository. Existing clips
 * become lettered entries; the legacy key is left untouched as a safety copy.
 */
export function migrateLegacyUtility(legacy: unknown, base = createInitialHubState()): HubState {
  if (!isObject(legacy)) return base;
  const tabs = Array.isArray(legacy.tabs) ? legacy.tabs.filter(isObject) : [];
  const clips = Array.isArray(legacy.clips) ? legacy.clips.filter(isObject) : [];

  // Legacy tab id -> letter, assigned in the legacy tab order.
  const map = new Map<string, HubLetter>();
  tabs.forEach((t, i) => {
    const letter = LETTERS[Math.min(i + 1, LETTERS.length - 1)]!; // keep A free for capture
    map.set(str(t.id), letter);
  });

  const entries: HubEntry[] = clips.map((c) => {
    const letter = map.get(str(c.tabId)) ?? "A";
    return {
      id: str(c.id) || uid("entry"),
      letter,
      title: str(c.title, "Untitled entry"),
      body: str(c.body),
      pinned: Boolean(c.pinned),
      createdAt: str(c.createdAt, now()),
      updatedAt: str(c.updatedAt, now()),
    };
  });

  // Carry legacy tab names onto their letters without losing letter identity.
  const labelled = base.tabs.map((tab) => {
    const src = tabs.find((t) => map.get(str(t.id)) === tab.letter);
    return src && str(src.name) ? { ...tab, label: str(src.name) } : tab;
  });

  const draft = isObject(legacy.draft) ? legacy.draft : {};
  const history = Array.isArray(legacy.history) ? legacy.history.filter(isObject) : [];

  return {
    ...base,
    tabs: labelled,
    entries,
    composer: { text: str(draft.text), savedAt: str(draft.savedAt) || null },
    history: history
      .slice(0, HISTORY_LIMIT)
      .map((h) => ({ id: str(h.id) || uid("h"), text: str(h.text), savedAt: str(h.savedAt, now()) })),
    migratedFrom: LEGACY_UTILITY_KEY,
  };
}

export function hydrateHub(raw: unknown, base = createInitialHubState()): HubState {
  if (!isObject(raw)) return base;
  const tabs = Array.isArray(raw.tabs) ? raw.tabs.filter(isObject) : [];
  const entries = Array.isArray(raw.entries) ? raw.entries.filter(isObject) : [];
  const quick = isObject(raw.quick) ? raw.quick : {};
  const composer = isObject(raw.composer) ? raw.composer : {};
  const history = Array.isArray(raw.history) ? raw.history.filter(isObject) : [];
  const known = new Set<string>(LETTERS);
  return {
    version: HUB_VERSION,
    tabs: base.tabs.map((tab) => {
      const stored = tabs.find((t) => str(t.letter) === tab.letter);
      return stored
        ? { letter: tab.letter, label: str(stored.label, tab.label), color: str(stored.color, tab.color) }
        : tab;
    }),
    entries: entries
      .filter((e) => known.has(str(e.letter)))
      .map((e) => ({
        id: str(e.id) || uid("entry"),
        letter: str(e.letter, "A") as HubLetter,
        title: str(e.title, "Untitled entry"),
        body: str(e.body),
        pinned: Boolean(e.pinned),
        createdAt: str(e.createdAt, now()),
        updatedAt: str(e.updatedAt, now()),
      })),
    activeLetter: known.has(str(raw.activeLetter)) ? (raw.activeLetter as HubLetter) : "A",
    quick: { text: str(quick.text), savedAt: str(quick.savedAt) || null },
    composer: { text: str(composer.text), savedAt: str(composer.savedAt) || null },
    history: history
      .slice(0, HISTORY_LIMIT)
      .map((h) => ({ id: str(h.id) || uid("h"), text: str(h.text), savedAt: str(h.savedAt, now()) })),
    migratedFrom: str(raw.migratedFrom) || null,
  };
}

/** Entries of one tab, in order. Their index + 1 is the visible number. */
export const entriesOf = (state: HubState, letter: HubLetter) =>
  state.entries.filter((e) => e.letter === letter);

export const codeOf = (state: HubState, entry: HubEntry) =>
  `${entry.letter}${entriesOf(state, entry.letter).findIndex((e) => e.id === entry.id) + 1}`;

function loadHub(): HubState {
  if (typeof window === "undefined") return createInitialHubState();
  try {
    const raw = window.localStorage.getItem(HUB_KEY);
    if (raw) return hydrateHub(JSON.parse(raw));
    const legacy = window.localStorage.getItem(LEGACY_UTILITY_KEY);
    if (legacy) return migrateLegacyUtility(JSON.parse(legacy));
    return createInitialHubState();
  } catch {
    return createInitialHubState();
  }
}

export function useHub() {
  const [hub, setHub] = useState<HubState>(() => createInitialHubState());
  const hydrated = useRef(false);

  useEffect(() => {
    setHub(loadHub());
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(HUB_KEY, JSON.stringify(hub));
    } catch {
      /* storage unavailable */
    }
  }, [hub]);

  const reloadHub = useCallback(() => setHub(loadHub()), []);

  const setActiveLetter = useCallback(
    (letter: HubLetter) => setHub((s) => ({ ...s, activeLetter: letter })),
    [],
  );

  const patchTab = useCallback((letter: HubLetter, patch: Partial<HubTab>) => {
    setHub((s) => ({
      ...s,
      tabs: s.tabs.map((t) => (t.letter === letter ? { ...t, ...patch, letter: t.letter } : t)),
    }));
  }, []);

  /** Appends as the next numbered entry of the tab. */
  const addEntry = useCallback((letter: HubLetter, patch?: Partial<HubEntry>) => {
    const stamp = now();
    const entry: HubEntry = {
      id: uid("entry"),
      title: "Untitled entry",
      body: "",
      pinned: false,
      createdAt: stamp,
      updatedAt: stamp,
      ...patch,
      letter,
    };
    setHub((s) => ({ ...s, entries: [...s.entries, entry] }));
    return entry.id;
  }, []);

  const patchEntry = useCallback((id: string, patch: Partial<HubEntry>) => {
    setHub((s) => ({
      ...s,
      entries: s.entries.map((e) => (e.id === id ? { ...e, ...patch, updatedAt: now() } : e)),
    }));
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setHub((s) => ({ ...s, entries: s.entries.filter((e) => e.id !== id) }));
  }, []);

  const moveEntry = useCallback((id: string, dir: -1 | 1) => {
    setHub((s) => {
      const entry = s.entries.find((e) => e.id === id);
      if (!entry) return s;
      const siblings = s.entries.filter((e) => e.letter === entry.letter);
      const i = siblings.findIndex((e) => e.id === id);
      const j = i + dir;
      if (j < 0 || j >= siblings.length) return s;
      [siblings[i], siblings[j]] = [siblings[j]!, siblings[i]!];
      const others = s.entries.filter((e) => e.letter !== entry.letter);
      return { ...s, entries: [...others, ...siblings] };
    });
  }, []);

  const moveEntryToTab = useCallback((id: string, letter: HubLetter) => {
    setHub((s) => ({
      ...s,
      entries: s.entries.map((e) => (e.id === id ? { ...e, letter, updatedAt: now() } : e)),
    }));
  }, []);

  const setQuick = useCallback((text: string) => {
    setHub((s) => ({ ...s, quick: { text, savedAt: now() } }));
  }, []);

  /**
   * Submit the quick field. A trailing hashtag routes the entry: "#c" files
   * into Tab C, "#A1"-style codes are left alone (they are lookups, not
   * routing). No tag → Tab A. The tag is stripped from the stored text.
   */
  const commitQuick = useCallback((text: string) => {
    const m = /#([a-kA-K])\s*$/.exec(text.trim());
    const letter = (m ? m[1]!.toUpperCase() : "A") as HubLetter;
    const trimmed = (m ? text.trim().slice(0, m.index) : text).trim();
    if (!trimmed) return null;
    const stamp = now();
    const entry: HubEntry = {
      id: uid("entry"),
      letter,
      title: trimmed.split("\n")[0]!.slice(0, 60),
      body: trimmed,
      pinned: false,
      createdAt: stamp,
      updatedAt: stamp,
    };
    setHub((s) => ({
      ...s,
      entries: [...s.entries, entry],
      quick: { text: "", savedAt: stamp },
      history: [{ id: uid("h"), text: trimmed, savedAt: stamp }, ...s.history].slice(
        0,
        HISTORY_LIMIT,
      ),
    }));
    return entry.id;
  }, []);

  const setComposer = useCallback((text: string) => {
    setHub((s) => ({ ...s, composer: { text, savedAt: now() } }));
  }, []);

  const commitComposerHistory = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setHub((s) =>
      s.history[0]?.text.trim() === trimmed
        ? s
        : {
            ...s,
            history: [{ id: uid("h"), text, savedAt: now() }, ...s.history].slice(0, HISTORY_LIMIT),
          },
    );
  }, []);

  return {
    hub,
    reloadHub,
    setActiveLetter,
    patchTab,
    addEntry,
    patchEntry,
    deleteEntry,
    moveEntry,
    moveEntryToTab,
    setQuick,
    commitQuick,
    setComposer,
    commitComposerHistory,
  };
}

export type HubApi = ReturnType<typeof useHub>;
