/** Lower utility facet — corkboard of twelve persistent Post-it notes. */

export type BoardRow = { id: string; text: string; done: boolean };

export type BoardNote = {
  id: string;
  color: string;
  title: string;
  body: string;
  /** A note is either freeform text or an editable checklist. */
  mode: "note" | "list";
  rows: BoardRow[];
  /** Text preserved when the note was converted to a list. Never destroyed. */
  recoveredBody: string | null;
  archived: boolean;
  updatedAt: string;
};

export type BoardState = {
  version: number;
  notes: BoardNote[];
  /** Note that centre quick-capture writes into. */
  saveForLaterId: string;
  quick: { text: string; savedAt: string | null };
  /** Last deleted/archived note, so the action can be undone. */
  undo: { note: BoardNote; index: number; action: "delete" | "archive" } | null;
};
