import { useState } from "react";
import type { SpacesRegistry } from "@/lib/noteworthy/spaces";
import { HoldDelete } from "./HoldDelete";

/** Compact space switcher: lists spaces, create, rename, hold-to-delete (inactive only). */
export function SpaceSwitcher({
  spaces,
  onSwitch,
  onCreate,
  onRename,
  onDelete,
}: {
  spaces: SpacesRegistry;
  onSwitch: (id: string) => void;
  onCreate: (name: string) => string;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const active = spaces.list.find((s) => s.id === spaces.active);

  return (
    <div className="relative h-full shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Space: ${active?.name ?? "Main"}. Switch space`}
        aria-expanded={open}
        data-testid="nw-space-switcher"
        className="h-full max-w-[28vw] truncate rounded-lg border border-border/60 bg-card/50 px-2 text-[10px] text-muted-foreground hover:text-foreground"
      >
        {active?.name ?? "Main"} ▾
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Spaces"
          className="absolute top-full right-0 z-[70] mt-1 w-56 space-y-1.5 rounded-xl border border-border/70 bg-card/95 p-2 shadow-2xl"
        >
          <span className="nw-label">Spaces</span>
          {spaces.list.map((s) => {
            const isActive = s.id === spaces.active;
            return (
              <div key={s.id} className="flex items-center gap-1">
                <button
                  onClick={() => {
                    onSwitch(s.id);
                    setOpen(false);
                  }}
                  aria-pressed={isActive}
                  className={`h-6 w-4 shrink-0 text-[10px] ${isActive ? "text-primary" : "text-muted-foreground"}`}
                  aria-label={`Open ${s.name}`}
                >
                  {isActive ? "●" : "○"}
                </button>
                <input
                  className="nw-input h-6 text-[11px]"
                  value={s.name}
                  aria-label={`Rename ${s.name}`}
                  onChange={(e) => onRename(s.id, e.target.value)}
                />
                {!isActive && <HoldDelete label={`Delete space ${s.name}`} onDelete={() => onDelete(s.id)} />}
              </div>
            );
          })}
          <div className="flex gap-1 border-t border-border/60 pt-1.5">
            <input
              className="nw-input h-6 text-[11px]"
              placeholder="New space name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="New space name"
            />
            <button
              onClick={() => {
                const id = onCreate(name);
                setName("");
                onSwitch(id);
                setOpen(false);
              }}
              className="h-6 shrink-0 rounded-md border border-primary/70 px-2 text-[10px] text-primary"
            >
              + Add
            </button>
          </div>
          <p className="text-[9px] text-muted-foreground">
            Each space has its own 15 facets. Top and bottom bars are shared. Hold ✕ to delete.
          </p>
        </div>
      )}
    </div>
  );
}
