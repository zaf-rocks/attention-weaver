/**
 * Upper utility facet — combined repository + notebook hub.
 *
 * Tabs A..K have permanent letter identity. Entry numbering is positional:
 * the Nth entry of tab C is always "C4"-style addressable, and renumbers
 * visibly when entries are reordered.
 */

export type HubLetter = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K";

export type HubTab = {
  /** Permanent identity. Never editable. */
  letter: HubLetter;
  /** Editable display label. */
  label: string;
  /** Editable colour (hex). Seeded from the canonical letter colour. */
  color: string;
};

export type HubEntry = {
  id: string;
  letter: HubLetter;
  title: string;
  body: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type HubDraft = { text: string; savedAt: string | null };

export type HubSnapshot = { id: string; text: string; savedAt: string };

export type HubState = {
  version: number;
  tabs: HubTab[];
  entries: HubEntry[];
  activeLetter: HubLetter;
  /** Centre quick-capture draft. Never silently overwritten. */
  quick: HubDraft;
  /** Notebook / composer draft. */
  composer: HubDraft;
  history: HubSnapshot[];
  /** Set once when legacy repository data was folded in, so it never repeats. */
  migratedFrom: string | null;
};
