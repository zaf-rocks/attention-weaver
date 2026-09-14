/**
 * Utility-facet data model.
 *
 * Deliberately separate from Facet / Weight state: the two utility bars are
 * outside the 100% attention budget and must never expose Weight or lock UI.
 */

export type RepoTab = {
  id: string;
  /** User-editable shortcut code: a letter, a number, or any short scheme. */
  code: string;
  name: string;
};

export type Clip = {
  id: string;
  tabId: string;
  title: string;
  body: string;
  tags: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string | null;
  /** Local prototype reuse reminder, in days. No OS notification is scheduled. */
  reuseIntervalDays: number | null;
  /** Scheduled alarms for this entry. In-app only — no system notifications. */
  reminders: Reminder[];
};

export type Reminder = {
  id: string;
  /** Local datetime string, "YYYY-MM-DDTHH:mm". */
  at: string;
  label: string;
  done: boolean;
};

export type DraftSnapshot = {
  id: string;
  text: string;
  savedAt: string;
};

export type DestinationKind =
  "repository" | "clipboard" | "share" | "email" | "websearch" | "custom";

export type Destination = {
  id: string;
  kind: DestinationKind;
  label: string;
  enabled: boolean;
  /** For kind === "custom": URL template containing the {text} placeholder. */
  template?: string;
};

export type UtilityState = {
  version: number;
  tabs: RepoTab[];
  clips: Clip[];
  activeTabId: string;
  draft: { text: string; savedAt: string | null };
  history: DraftSnapshot[];
  /** Tabs pre-selected by "Save to repository". */
  defaultTabIds: string[];
  destinations: Destination[];
};
