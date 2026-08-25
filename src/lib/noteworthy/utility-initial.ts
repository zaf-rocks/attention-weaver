import type { Destination, RepoTab, UtilityState } from "./utility-types";

export const UTILITY_VERSION = 1;
export const HISTORY_LIMIT = 25;

const TAB_SEEDS: Array<[string, string, string]> = [
  ["tab-ai-image", "A", "AI Image"],
  ["tab-video", "B", "Video"],
  ["tab-vibe", "C", "Vibe-Coder"],
  ["tab-music", "D", "Music"],
  ["tab-custom", "E", "Customization"],
  ["tab-source", "1", "Source Packets"],
  ["tab-starter", "2", "Starter"],
  ["tab-repeat", "3", "Repeatable"],
  ["tab-user-1", "4", "User Tab 1"],
  ["tab-user-2", "5", "User Tab 2"],
];

export const createTabs = (): RepoTab[] =>
  TAB_SEEDS.map(([id, code, name]) => ({ id, code, name }));

export const createDestinations = (): Destination[] => [
  { id: "dst-repository", kind: "repository", label: "Save to repository", enabled: true },
  { id: "dst-clipboard", kind: "clipboard", label: "Copy", enabled: true },
  { id: "dst-share", kind: "share", label: "Share", enabled: true },
  { id: "dst-email", kind: "email", label: "Email draft", enabled: true },
  { id: "dst-websearch", kind: "websearch", label: "Web search", enabled: true },
];

export function createInitialUtilityState(): UtilityState {
  const tabs = createTabs();
  return {
    version: UTILITY_VERSION,
    tabs,
    clips: [
      {
        id: "clip-seed-1",
        tabId: "tab-starter",
        title: "Session opener",
        body: "Read the project knowledge, audit what already exists, then state what you will change before editing.",
        tags: ["starter"],
        pinned: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastUsedAt: null,
        reuseIntervalDays: null,
        reminders: [],
      },
    ],
    activeTabId: tabs[0]!.id,
    draft: { text: "", savedAt: null },
    history: [],
    defaultTabIds: ["tab-starter"],
    destinations: createDestinations(),
  };
}

export const uid = (p: string) =>
  `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
