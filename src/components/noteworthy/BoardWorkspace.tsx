import { useState } from "react";
import type { Facet } from "@/lib/noteworthy/types";
import type { BoardNote } from "@/lib/noteworthy/board-types";
import type { BoardApi } from "@/lib/noteworthy/board-store";
import { CustomizeFace } from "./CustomizeFace";
import { WorkspaceHeader } from "./UtilityStage";

/** Lower utility workspace: a corkboard of persistent Post-it notes. */
export function BoardWorkspace({
  api,
  facet,
  onPatchFacet,
  onClose,
}: {
  api: BoardApi;
  facet: Facet;
  onPatchFacet: (patch: Partial<Facet>) => void;
  onClose: () => void;
}) {
  const [customizing, setCustomizing] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const { board } = api;

  if (customizing) {
    return (
      <CustomizeFace
        facet={facet}
        onPatch={onPatchFacet}
        onBack={() => setCustomizing(false)}
        onClose={onClose}
      />
    );
  }

  const visible = board.notes.filter((n) => showArchived || !n.archived);
  const open = openId ? board.notes.find((n) => n.id === openId) : null;

  return (
    <div className="flex h-full flex-col">
      <WorkspaceHeader
        title="Corkboard"
        subtitle={`${board.notes.filter((n) => !n.archived).length} notes · quick thoughts go to ${
          board.notes.find((n) => n.id === board.saveForLaterId)?.title ?? "Save for Later"
        }`}
        onClose={onClose}
      >
        <button
          type="button"
          data-testid="nw-board-customize"
          onClick={() => setCustomizing(true)}
          className="shrink-0 rounded-md border border-border/60 px-2 py-1 text-[10px] tracking-widest uppercase"
        >
          Customize
        </button>
      </WorkspaceHeader>

      {open ? (
        <NoteEditor
          note={open}
          api={api}
          onBack={() => setOpenId(null)}
          isTarget={open.id === board.saveForLaterId}
        />
      ) : (
        <div
          className="nw-scroll min-h-0 flex-1 px-2 py-2"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 15%, rgba(120,72,40,0.18), transparent 55%), radial-gradient(circle at 80% 80%, rgba(90,52,28,0.18), transparent 55%)",
          }}
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {visible.map((note) => (
              <button
                key={note.id}
                type="button"
                data-testid={`nw-note-${note.id}`}
                onClick={() => setOpenId(note.id)}
                className={`flex h-[112px] flex-col rounded-[3px] p-2 text-left ${
                  note.archived ? "opacity-45" : ""
                }`}
                style={{
                  background: `linear-gradient(160deg, ${note.color}, ${note.color}cc)`,
                  color: "#14161d",
                  boxShadow: "0 6px 12px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.5)",
                  transform: `rotate(${(note.title.length % 3) - 1}deg)`,
                }}
              >
                <span className="line-clamp-2 text-[11px] font-semibold">{note.title}</span>
                {note.mode === "list" ? (
                  <span className="mt-1 text-[9.5px] opacity-80">
                    {note.rows.filter((r) => !r.done).length} of {note.rows.length} open
                  </span>
                ) : (
                  <span className="mt-1 line-clamp-4 text-[9.5px] whitespace-pre-wrap opacity-80">
                    {note.body}
                  </span>
                )}
                {note.id === board.saveForLaterId && (
                  <span className="mt-auto text-[8px] tracking-widest uppercase opacity-70">
                    quick thoughts land here
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <footer className="flex shrink-0 flex-wrap items-center gap-2 border-t border-border/60 px-3 py-2">
        {board.undo ? (
          <button
            type="button"
            data-testid="nw-board-undo"
            onClick={api.undoLast}
            className="rounded-md border border-primary/60 px-2 py-1 text-[10px]"
          >
            Undo {board.undo.action}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setShowArchived((v) => !v)}
              className="rounded-md border border-border/60 px-2 py-1 text-[10px]"
            >
              {showArchived ? "Hide archived" : "Show archived"}
            </button>
            <button
              type="button"
              onClick={() => setOpenId(api.addNote())}
              className="rounded-md border border-border/60 px-2 py-1 text-[10px]"
            >
              + note
            </button>
          </>
        )}
        <span className="ml-auto text-[10px] text-muted-foreground">Saved locally</span>
        <button
          onClick={onClose}
          data-testid="nw-board-return"
          className="rounded-lg border border-primary/60 bg-primary/15 px-3 py-1.5 text-[11px] tracking-[0.16em] uppercase"
        >
          Return to field
        </button>
      </footer>
    </div>
  );
}

function NoteEditor({
  note,
  api,
  onBack,
  isTarget,
}: {
  note: BoardNote;
  api: BoardApi;
  onBack: () => void;
  isTarget: boolean;
}) {
  const [newRow, setNewRow] = useState("");
  return (
    <div className="nw-scroll min-h-0 flex-1 space-y-2 px-3 py-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="shrink-0 rounded-md border border-border/60 px-2 py-1 text-[10px]"
        >
          ‹ Board
        </button>
        <input
          type="color"
          className="h-7 w-8 shrink-0 rounded border border-border/60 bg-transparent"
          value={note.color}
          onChange={(e) => api.patchNote(note.id, { color: e.target.value })}
          aria-label="Note colour"
        />
        <input
          className="nw-input text-[12px] font-semibold"
          value={note.title}
          onChange={(e) => api.patchNote(note.id, { title: e.target.value })}
          aria-label="Note title"
          data-testid="nw-note-title"
        />
      </div>

      {note.mode === "note" ? (
        <textarea
          data-testid="nw-note-body"
          className="nw-input min-h-[140px] resize-y text-[12px]"
          value={note.body}
          onChange={(e) => api.patchNote(note.id, { body: e.target.value })}
          aria-label="Note text"
        />
      ) : (
        <div className="space-y-1">
          <ul className="space-y-1">
            {note.rows.map((row) => (
              <li key={row.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={row.done}
                  onChange={(e) => api.patchRow(note.id, row.id, { done: e.target.checked })}
                  className="h-4 w-4 shrink-0 accent-[var(--primary)]"
                  aria-label={`Complete ${row.text}`}
                />
                <input
                  className={`nw-input text-[12px] ${row.done ? "line-through opacity-60" : ""}`}
                  value={row.text}
                  onChange={(e) => api.patchRow(note.id, row.id, { text: e.target.value })}
                  aria-label="List row"
                />
                <button
                  type="button"
                  aria-label="Remove row"
                  onClick={() => api.removeRow(note.id, row.id)}
                  className="shrink-0 px-1 text-muted-foreground hover:text-destructive"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!newRow.trim()) return;
              api.addRow(note.id, newRow.trim());
              setNewRow("");
            }}
          >
            <input
              className="nw-input text-[12px]"
              placeholder="Add row"
              value={newRow}
              onChange={(e) => setNewRow(e.target.value)}
              aria-label="New list row"
              data-testid="nw-note-new-row"
            />
            <button className="shrink-0 rounded-lg border border-border px-3 text-sm">+</button>
          </form>
          {note.recoveredBody && (
            <p className="text-[10px] text-muted-foreground">
              Original note text is kept — switch back to note form to recover it.
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        {note.mode === "note" ? (
          <Btn label="Convert to list" testId="nw-note-to-list" onClick={() => api.toList(note.id)} />
        ) : (
          <Btn label="Back to note" testId="nw-note-to-note" onClick={() => api.toNote(note.id)} />
        )}
        {!isTarget && (
          <Btn label="Send quick thoughts here" onClick={() => api.setSaveTarget(note.id)} />
        )}
        <Btn
          label={note.archived ? "Unarchive" : "Archive"}
          onClick={() =>
            note.archived
              ? api.patchNote(note.id, { archived: false })
              : api.removeNote(note.id, "archive")
          }
        />
        <Btn
          label="Delete"
          danger
          onClick={() => {
            if (window.confirm(`Delete "${note.title}"? You can undo this right after.`)) {
              api.removeNote(note.id, "delete");
              onBack();
            }
          }}
        />
      </div>
    </div>
  );
}

function Btn({
  label,
  onClick,
  danger,
  testId,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  testId?: string;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      className={`rounded-md border px-2 py-1 text-[10px] ${
        danger ? "border-destructive/60 text-destructive" : "border-border/60 hover:bg-accent/25"
      }`}
    >
      {label}
    </button>
  );
}
