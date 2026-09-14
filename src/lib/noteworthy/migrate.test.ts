import { describe, expect, it } from "vitest";
import { STATE_VERSION, createInitialState } from "./initial";
import { mergeDescription, migrateState } from "./migrate";

describe("fixed-field state migration", () => {
  it("keeps distinct legacy tagline and overview text in the new description", () => {
    expect(mergeDescription("", "Short promise", "Longer overview")).toBe(
      "Short promise\n\nLonger overview",
    );
    expect(mergeDescription("Current description", "Legacy", "Legacy overview")).toBe(
      "Current description\n\nLegacy\n\nLegacy overview",
    );
  });

  it("preserves user content while dropping legacy Weight fields", () => {
    const legacy = createInitialState() as unknown as Record<string, unknown>;
    const legacyFacets = legacy["facets"] as Record<string, Record<string, unknown>>;
    legacyFacets["C"] = {
      ...legacyFacets["C"],
      title: "My real focus",
      description: "Current description",
      tagline: "One-line context",
      overview: "My detailed context",
      notes: "Do not lose this",
      weight: 160,
      notch: 2,
      locked: true,
      tasks: [
        {
          id: "parent",
          text: "Parent task",
          done: false,
          subtasks: [{ id: "child", text: "Child task", done: true }],
        },
      ],
    };

    const migrated = migrateState(legacy);
    const center = migrated.facets.C;

    expect(migrated.version).toBe(STATE_VERSION);
    expect(center.title).toBe("My real focus");
    expect(center.description).toBe(
      "Current description\n\nOne-line context\n\nMy detailed context",
    );
    expect(center.notes).toBe("Do not lose this");
    expect(center.tasks[0]?.subtasks[0]?.text).toBe("Child task");
    expect(center).not.toHaveProperty("weight");
    expect(center).not.toHaveProperty("notch");
    expect(center).not.toHaveProperty("locked");
  });

  it("repairs a partial state to the complete fixed 17-facet field", () => {
    const migrated = migrateState({
      facets: { C: { title: "Only surviving facet", tasks: [] } },
      settings: {},
    });

    expect(Object.keys(migrated.facets)).toHaveLength(17);
    expect(migrated.facets.C.title).toBe("Only surviving facet");
    expect(migrated.facets.TL.title).toBeTruthy();
  });
});
