import { useCallback, useEffect, useRef, useState } from "react";
import type { BoardNote, BoardRow, BoardState } from "./board-types";

export const BOARD_KEY = "noteworthy.board.v1";
export const BOARD_VERSION = 1;
export const SAVE_FOR_LATER_ID = "note-save-later";

const uid = (p: string) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const now = () => new Date().toISOString();

const SEEDS: Array<[string, string, string]> = [
  [SAVE_FOR_LATER_ID, "#ffe066", "Save for Later"],
  ["note-today", "#ffd6a5", "Today"],
  ["note-week", "#fdffb6", "This Week"],
  ["note-errands", "#caffbf", "Errands"],
  ["note-calls", "#9bf6ff", "Calls & Messages"],
  ["note-ideas", "#a0c4ff", "Ideas"],
  ["note-buy", "#bdb2ff", "To Buy"],
  ["note-waiting", "#ffc6ff", "Waiting On"],
  ["note-home", "#ffadad", "Home"],
  ["note-money", "#b9fbc0", "Money"],
  ["note-health", "#ffb5a7", "Health"],
  ["note-someday", "#d0d1ff", "Someday"],
];

export function createInitialBoardState(): BoardState {
  return {
    version: BOARD_VERSION,
    notes: SEEDS.map(([id, color, title]) => ({
      id,
      color,
      title,
      body: "",
      mode: "note",
      rows: [],
      recoveredBody: null,
      archived: false,
      updatedAt: now(),
    })),
    saveForLaterId: SAVE_FOR_LATER_ID,
    quick: { text: "", savedAt: null },
    undo: null,
  };
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, f = "") => (typeof v === "string" ? v : f);

export function hydrateBoard(raw: unknown): BoardState {
  const base = createInitialBoardState();
  if (!isObject(raw) || !Array.isArray(raw.notes)) return base;
  const notes = raw.notes.filter(isObject).map((n, i): BoardNote => {
    const seed = base.notes[i] ?? base.notes[0]!;
    const rows = Array.isArray(n.rows) ? n.rows.filter(isObject) : [];
    return {
      id: str(n.id) || seed.id,
      color: str(n.color, seed.color),
      title: str(n.title, seed.title),
      body: str(n.body),
      mode: n.mode === "list" ? "list" : "note",
      rows: rows.map((r): BoardRow => ({
        id: str(r.id) || uid("row"),
        text: str(r.text),
        done: Boolean(r.done),
      })),
      recoveredBody: typeof n.recoveredBody === "string" ? n.recoveredBody : null,
      archived: Boolean(n.archived),
      updatedAt: str(n.updatedAt, now()),
    };
  });
  const quick = isObject(raw.quick) ? raw.quick : {};
  const saveId = str(raw.saveForLaterId, SAVE_FOR_LATER_ID);
  return {
    version: BOARD_VERSION,
    notes,
    saveForLaterId: notes.some((n) => n.id === saveId) ? saveId : (notes[0]?.id ?? SAVE_FOR_LATER_ID),
    quick: { text: str(quick.text), savedAt: str(quick.savedAt) || null },
    undo: null,
  };
}

function loadBoard(): BoardState {
  if (typeof window === "undefined") return createInitialBoardState();
  try {
    const raw = window.localStorage.getItem(BOARD_KEY);
    return raw ? hydrateBoard(JSON.parse(raw)) : createInitialBoardState();
  } catch {
    return createInitialBoardState();
  }
}

export function useBoard() {
  const [board, setBoard] = useState<BoardState>(() => createInitialBoardState());
  const hydrated = useRef(false);

  useEffect(() => {
    setBoard(loadBoard());
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(BOARD_KEY, JSON.stringify(board));
    } catch {
      /* storage unavailable */
    }
  }, [board]);

  const reloadBoard = useCallback(() => setBoard(loadBoard()), []);

  const patchNote = useCallback((id: string, patch: Partial<BoardNote>) => {
    setBoard((s) => ({
      ...s,
      notes: s.notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: now() } : n)),
    }));
  }, []);

  const addNote = useCallback(() => {
    const note: BoardNote = {
      id: uid("note"),
      color: "#fdffb6",
      title: "New note",
      body: "",
      mode: "note",
      rows: [],
      recoveredBody: null,
      archived: false,
      updatedAt: now(),
    };
    setBoard((s) => ({ ...s, notes: [...s.notes, note] }));
    return note.id;
  }, []);

  const removeNote = useCallback((id: string, action: "delete" | "archive") => {
    setBoard((s) => {
      const index = s.notes.findIndex((n) => n.id === id);
      if (index < 0) return s;
      const note = s.notes[index]!;
      if (action === "archive") {
        return {
          ...s,
          notes: s.notes.map((n) => (n.id === id ? { ...n, archived: true, updatedAt: now() } : n)),
          undo: { note, index, action },
        };
      }
      return { ...s, notes: s.notes.filter((n) => n.id !== id), undo: { note, index, action } };
    });
  }, []);

  const undoLast = useCallback(() => {
    setBoard((s) => {
      if (!s.undo) return s;
      const { note, index, action } = s.undo;
      if (action === "archive") {
        return {
          ...s,
          notes: s.notes.map((n) => (n.id === note.id ? { ...n, archived: false } : n)),
          undo: null,
        };
      }
      const notes = [...s.notes];
      notes.splice(Math.min(index, notes.length), 0, note);
      return { ...s, notes, undo: null };
    });
  }, []);

  const clearUndo = useCallback(() => setBoard((s) => ({ ...s, undo: null })), []);

  /** Non-destructive conversion: the original text is kept for recovery. */
  const toList = useCallback((id: string) => {
    setBoard((s) => ({
      ...s,
      notes: s.notes.map((n) => {
        if (n.id !== id || n.mode === "list") return n;
        const lines = n.body
          .split("\n")
          .map((l) => l.replace(/^[-*\u2022]\s*/, "").trim())
          .filter(Boolean);
        return {
          ...n,
          mode: "list",
          recoveredBody: n.body,
          rows: lines.length ? lines.map((text) => ({ id: uid("row"), text, done: false })) : n.rows,
          updatedAt: now(),
        };
      }),
    }));
  }, []);

  const toNote = useCallback((id: string) => {
    setBoard((s) => ({
      ...s,
      notes: s.notes.map((n) => {
        if (n.id !== id || n.mode === "note") return n;
        const fromRows = n.rows.map((r) => (r.done ? `- [x] ${r.text}` : `- ${r.text}`)).join("\n");
        return { ...n, mode: "note", body: n.recoveredBody ?? fromRows, updatedAt: now() };
      }),
    }));
  }, []);

  const addRow = useCallback((id: string, text = "") => {
    setBoard((s) => ({
      ...s,
      notes: s.notes.map((n) =>
        n.id === id
          ? { ...n, rows: [...n.rows, { id: uid("row"), text, done: false }], updatedAt: now() }
          : n,
      ),
    }));
  }, []);

  const patchRow = useCallback((noteId: string, rowId: string, patch: Partial<BoardRow>) => {
    setBoard((s) => ({
      ...s,
      notes: s.notes.map((n) =>
        n.id === noteId
          ? {
              ...n,
              rows: n.rows.map((r) => (r.id === rowId ? { ...r, ...patch } : r)),
              updatedAt: now(),
            }
          : n,
      ),
    }));
  }, []);

  const removeRow = useCallback((noteId: string, rowId: string) => {
    setBoard((s) => ({
      ...s,
      notes: s.notes.map((n) =>
        n.id === noteId ? { ...n, rows: n.rows.filter((r) => r.id !== rowId), updatedAt: now() } : n,
      ),
    }));
  }, []);

  const setSaveTarget = useCallback(
    (id: string) => setBoard((s) => ({ ...s, saveForLaterId: id })),
    [],
  );

  const setQuick = useCallback((text: string) => {
    setBoard((s) => ({ ...s, quick: { text, savedAt: now() } }));
  }, []);

  /**
   * Submit the lower quick field. A trailing "#n3"-style hashtag routes the
   * thought onto the 3rd visible Post-it (1-based, in board order); no tag →
   * the designated Save for Later note. The tag is stripped from the text.
   */
  const commitQuick = useCallback((text: string) => {
    const m = /#n([1-9]|1[0-2])\s*$/i.exec(text.trim());
    const trimmed = (m ? text.trim().slice(0, m.index) : text).trim();
    if (!trimmed) return;
    setBoard((s) => {
      const visible = s.notes.filter((n) => !n.archived);
      const target = m ? visible[Number(m[1]) - 1] : undefined;
      const targetId = target?.id ?? s.saveForLaterId;
      return {
        ...s,
        notes: s.notes.map((n) => {
          if (n.id !== targetId) return n;
          return n.mode === "list"
            ? { ...n, rows: [...n.rows, { id: uid("row"), text: trimmed, done: false }], updatedAt: now() }
            : { ...n, body: n.body ? `${n.body}\n${trimmed}` : trimmed, updatedAt: now() };
        }),
        quick: { text: "", savedAt: now() },
      };
    });
  }, []);

  return {
    board,
    reloadBoard,
    addNote,
    patchNote,
    removeNote,
    undoLast,
    clearUndo,
    toList,
    toNote,
    addRow,
    patchRow,
    removeRow,
    setSaveTarget,
    setQuick,
    commitQuick,
  };
}

export type BoardApi = ReturnType<typeof useBoard>;
