import { useCallback, useEffect, useRef, useState } from "react";
import type { Clip, Destination, DraftSnapshot, RepoTab, UtilityState } from "./utility-types";
import { HISTORY_LIMIT, UTILITY_VERSION, createInitialUtilityState, uid } from "./utility-initial";

const KEY = "noteworthy.utility.v1";

/** Tolerant merge: unknown/missing fields fall back to defaults, nothing is dropped. */
function migrate(raw: unknown): UtilityState {
  const base = createInitialUtilityState();
  if (!raw || typeof raw !== "object") return base;
  const p = raw as Partial<UtilityState>;
  const tabs = Array.isArray(p.tabs) && p.tabs.length ? (p.tabs as RepoTab[]) : base.tabs;
  const clips = Array.isArray(p.clips) ? (p.clips as Clip[]) : base.clips;
  const tabIds = new Set(tabs.map((t) => t.id));
  return {
    version: UTILITY_VERSION,
    tabs,
    clips: clips
      .filter((c) => c && typeof c.id === "string")
      .map((c) => ({
        ...c,
        tags: Array.isArray(c.tags) ? c.tags : [],
        pinned: Boolean(c.pinned),
        lastUsedAt: c.lastUsedAt ?? null,
        reuseIntervalDays: c.reuseIntervalDays ?? null,
        reminders: Array.isArray(c.reminders) ? c.reminders : [],
        tabId: tabIds.has(c.tabId) ? c.tabId : tabs[0]!.id,
      })),
    activeTabId: tabIds.has(p.activeTabId ?? "") ? p.activeTabId! : tabs[0]!.id,
    draft: p.draft && typeof p.draft.text === "string" ? p.draft : base.draft,
    history: Array.isArray(p.history) ? (p.history as DraftSnapshot[]).slice(0, HISTORY_LIMIT) : [],
    defaultTabIds: (Array.isArray(p.defaultTabIds) ? p.defaultTabIds : base.defaultTabIds).filter(
      (id) => tabIds.has(id),
    ),
    destinations:
      Array.isArray(p.destinations) && p.destinations.length
        ? (p.destinations as Destination[])
        : base.destinations,
  };
}

function load(): UtilityState {
  if (typeof window === "undefined") return createInitialUtilityState();
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? migrate(JSON.parse(raw)) : createInitialUtilityState();
  } catch {
    return createInitialUtilityState();
  }
}

const now = () => new Date().toISOString();

export function useUtility() {
  const [state, setState] = useState<UtilityState>(() => createInitialUtilityState());
  const hydrated = useRef(false);

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

  /* ---------------- tabs ---------------- */
  const addTab = useCallback((code: string, name: string) => {
    const tab: RepoTab = { id: uid("tab"), code: code || "?", name: name || "New Tab" };
    setState((s) => ({ ...s, tabs: [...s.tabs, tab], activeTabId: tab.id }));
  }, []);

  const patchTab = useCallback((id: string, patch: Partial<RepoTab>) => {
    setState((s) => ({ ...s, tabs: s.tabs.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
  }, []);

  const deleteTab = useCallback((id: string) => {
    setState((s) => {
      if (s.tabs.length <= 1) return s;
      const tabs = s.tabs.filter((t) => t.id !== id);
      return {
        ...s,
        tabs,
        clips: s.clips.filter((c) => c.tabId !== id),
        activeTabId: s.activeTabId === id ? tabs[0]!.id : s.activeTabId,
        defaultTabIds: s.defaultTabIds.filter((t) => t !== id),
      };
    });
  }, []);

  const moveTab = useCallback((id: string, dir: -1 | 1) => {
    setState((s) => {
      const i = s.tabs.findIndex((t) => t.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= s.tabs.length) return s;
      const tabs = [...s.tabs];
      [tabs[i], tabs[j]] = [tabs[j]!, tabs[i]!];
      return { ...s, tabs };
    });
  }, []);

  const setActiveTab = useCallback((id: string) => setState((s) => ({ ...s, activeTabId: id })), []);

  /* ---------------- clips ---------------- */
  const addClip = useCallback((tabId: string, patch?: Partial<Clip>) => {
    const stamp = now();
    const clip: Clip = {
      id: uid("clip"),
      tabId,
      title: "Untitled clip",
      body: "",
      tags: [],
      pinned: false,
      createdAt: stamp,
      updatedAt: stamp,
      lastUsedAt: null,
      reuseIntervalDays: null,
      reminders: [],
      ...patch,
    };
    setState((s) => ({ ...s, clips: [clip, ...s.clips] }));
    return clip.id;
  }, []);

  const patchClip = useCallback((id: string, patch: Partial<Clip>) => {
    setState((s) => ({
      ...s,
      clips: s.clips.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: now() } : c)),
    }));
  }, []);

  const deleteClip = useCallback((id: string) => {
    setState((s) => ({ ...s, clips: s.clips.filter((c) => c.id !== id) }));
  }, []);

  const duplicateClip = useCallback((id: string) => {
    setState((s) => {
      const src = s.clips.find((c) => c.id === id);
      if (!src) return s;
      const stamp = now();
      return {
        ...s,
        clips: [
          { ...src, id: uid("clip"), title: `${src.title} (copy)`, createdAt: stamp, updatedAt: stamp, lastUsedAt: null },
          ...s.clips,
        ],
      };
    });
  }, []);

  const markUsed = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      clips: s.clips.map((c) => (c.id === id ? { ...c, lastUsedAt: now() } : c)),
    }));
  }, []);

  const moveClip = useCallback((id: string, dir: -1 | 1) => {
    setState((s) => {
      const clip = s.clips.find((c) => c.id === id);
      if (!clip) return s;
      const siblings = s.clips.filter((c) => c.tabId === clip.tabId);
      const i = siblings.findIndex((c) => c.id === id);
      const j = i + dir;
      if (j < 0 || j >= siblings.length) return s;
      [siblings[i], siblings[j]] = [siblings[j]!, siblings[i]!];
      const rest = s.clips.filter((c) => c.tabId !== clip.tabId);
      return { ...s, clips: [...siblings, ...rest] };
    });
  }, []);

  /* ---------------- capture dock ---------------- */
  const setDraft = useCallback((text: string) => {
    setState((s) => ({ ...s, draft: { text, savedAt: now() } }));
  }, []);

  /** Push the current draft into bounded history; identical consecutive text is ignored. */
  const commitHistory = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setState((s) => {
      if (s.history[0]?.text.trim() === trimmed) return s;
      const entry: DraftSnapshot = { id: uid("draft"), text, savedAt: now() };
      return { ...s, history: [entry, ...s.history].slice(0, HISTORY_LIMIT) };
    });
  }, []);

  const clearDraft = useCallback(() => {
    setState((s) => {
      const trimmed = s.draft.text.trim();
      const history =
        trimmed && s.history[0]?.text.trim() !== trimmed
          ? [{ id: uid("draft"), text: s.draft.text, savedAt: now() }, ...s.history].slice(
              0,
              HISTORY_LIMIT,
            )
          : s.history;
      return { ...s, draft: { text: "", savedAt: now() }, history };
    });
  }, []);

  const setDefaultTabs = useCallback((ids: string[]) => {
    setState((s) => ({ ...s, defaultTabIds: ids }));
  }, []);

  /* ---------------- destinations ---------------- */
  const patchDestination = useCallback((id: string, patch: Partial<Destination>) => {
    setState((s) => ({
      ...s,
      destinations: s.destinations.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    }));
  }, []);

  const addCustomDestination = useCallback(() => {
    setState((s) => ({
      ...s,
      destinations: [
        ...s.destinations,
        {
          id: uid("dst"),
          kind: "custom",
          label: "Custom destination",
          enabled: true,
          template: "https://example.com/?q={text}",
        },
      ],
    }));
  }, []);

  const removeDestination = useCallback((id: string) => {
    setState((s) => ({ ...s, destinations: s.destinations.filter((d) => d.id !== id) }));
  }, []);

  const moveDestination = useCallback((id: string, dir: -1 | 1) => {
    setState((s) => {
      const i = s.destinations.findIndex((d) => d.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= s.destinations.length) return s;
      const destinations = [...s.destinations];
      [destinations[i], destinations[j]] = [destinations[j]!, destinations[i]!];
      return { ...s, destinations };
    });
  }, []);

  return {
    utility: state,
    addTab,
    patchTab,
    deleteTab,
    moveTab,
    setActiveTab,
    addClip,
    patchClip,
    deleteClip,
    duplicateClip,
    markUsed,
    moveClip,
    setDraft,
    commitHistory,
    clearDraft,
    setDefaultTabs,
    patchDestination,
    addCustomDestination,
    removeDestination,
    moveDestination,
  };
}

export type UtilityApi = ReturnType<typeof useUtility>;
