import { describe, expect, it } from "vitest";
import { codeOf, createInitialHubState, entriesOf, hydrateHub, migrateLegacyUtility } from "./hub-store";
import { createInitialBoardState, hydrateBoard, SAVE_FOR_LATER_ID } from "./board-store";
import { buildBackup, validateBackup } from "./backup";
import { mergeDescription, migrateState } from "./migrate";

describe("hub", () => {
  it("seeds A–K with stable letters and no entries", () => {
    const s = createInitialHubState();
    expect(s.tabs.map((t) => t.letter).join("")).toBe("ABCDEFGHIJK");
    expect(s.entries).toHaveLength(0);
  });

  it("numbers entries positionally per tab", () => {
    const s = createInitialHubState();
    const mk = (id: string, letter: "A" | "C") => ({
      id, letter, title: id, body: "", pinned: false, createdAt: "", updatedAt: "",
    });
    s.entries = [mk("a1", "A"), mk("c1", "C"), mk("a2", "A")];
    expect(codeOf(s, s.entries[2]!)).toBe("A2");
    expect(codeOf(s, s.entries[1]!)).toBe("C1");
    expect(entriesOf(s, "A").map((e) => e.id)).toEqual(["a1", "a2"]);
  });

  it("migrates legacy clips once, preserving text, keeping A free", () => {
    const legacy = {
      tabs: [{ id: "t1", code: "A", name: "AI Image" }, { id: "t2", code: "B", name: "Video" }],
      clips: [{ id: "c1", tabId: "t2", title: "Hi", body: "keep me" }],
      draft: { text: "draft text" },
    };
    const s = migrateLegacyUtility(legacy);
    expect(s.entries[0]).toMatchObject({ id: "c1", letter: "C", body: "keep me" });
    expect(s.tabs.find((t) => t.letter === "B")!.label).toBe("AI Image");
    expect(s.composer.text).toBe("draft text");
    expect(s.migratedFrom).toBe("noteworthy.utility.v1");
    // Re-hydrating the saved hub never re-adds legacy entries.
    expect(hydrateHub(JSON.parse(JSON.stringify(s))).entries).toHaveLength(1);
  });
});

describe("board", () => {
  it("seeds twelve notes with a Save for Later target", () => {
    const b = createInitialBoardState();
    expect(b.notes).toHaveLength(12);
    expect(new Set(b.notes.map((n) => n.color)).size).toBe(12);
    expect(b.saveForLaterId).toBe(SAVE_FOR_LATER_ID);
  });

  it("hydrates stored notes without losing list rows or recovery text", () => {
    const b = createInitialBoardState();
    b.notes[0] = { ...b.notes[0]!, mode: "list", recoveredBody: "orig", rows: [{ id: "r", text: "x", done: true }] };
    const h = hydrateBoard(JSON.parse(JSON.stringify(b)));
    expect(h.notes[0]).toMatchObject({ mode: "list", recoveredBody: "orig" });
    expect(h.notes[0]!.rows[0]).toMatchObject({ text: "x", done: true });
  });
});

describe("backup + migration", () => {
  it("round-trips a backup including hub and board", () => {
    const main = { facets: { C: { title: "x" } } };
    const r = validateBackup(JSON.parse(JSON.stringify(buildBackup(main, {}, new Date(), { entries: [] }, { notes: [] }))));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.backup.hub).toEqual({ entries: [] });
  });

  it("rejects invalid and newer files", () => {
    expect(validateBackup({ kind: "other" }).ok).toBe(false);
    expect(validateBackup({ ...buildBackup({ facets: {} }, {}), backupFormat: 99 }).ok).toBe(false);
  });

  it("merges tagline + overview without losing text and drops weight", () => {
    expect(mergeDescription("", "Tag", "Over")).toBe("Tag\n\nOver");
    const s = migrateState({ facets: { C: { title: "Mine", tagline: "t", weight: 260, notch: 1 } } });
    expect(s.facets.C.title).toBe("Mine");
    expect(s.facets.C.description).toBe("t");
    expect("weight" in s.facets.C).toBe(false);
  });
});
