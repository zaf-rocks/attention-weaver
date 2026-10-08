import { useEffect, useState } from "react";
import { STARTER_MARKS, loadMarks, saveMarks } from "@/lib/noteworthy/color";
import { HoldDelete } from "./HoldDelete";

/** Take the first user-perceived character (handles emoji + combining marks). */
function firstGrapheme(s: string): string {
  const t = s.trim();
  if (!t) return "";
  const Seg = (Intl as unknown as { Segmenter?: new (l?: string, o?: object) => { segment: (s: string) => Iterable<{ segment: string }> } }).Segmenter;
  if (Seg) for (const g of new Seg(undefined, { granularity: "grapheme" }).segment(t)) return g.segment;
  return Array.from(t)[0] ?? "";
}

/** Freeform emoji / Unicode mark input with a personal saved collection. */
export function MarkPicker({ value, onChange }: { value: string; onChange: (m: string) => void }) {
  const [mine, setMine] = useState<string[]>([]);
  const [text, setText] = useState("");
  useEffect(() => setMine(loadMarks()), []);

  const use = (m: string) => {
    if (!m) return;
    onChange(m);
    const next = [m, ...loadMarks().filter((x) => x !== m)];
    setMine(next);
    saveMarks(next);
  };
  const remove = (m: string) => {
    const next = loadMarks().filter((x) => x !== m);
    setMine(next);
    saveMarks(next);
  };
  const starters = STARTER_MARKS.filter((m) => !mine.includes(m));

  return (
    <div className="space-y-1.5">
      <span className="nw-label">Mark</span>
      <div className="flex items-center gap-1.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-primary text-base">{value}</span>
        <input
          className="nw-input h-8 text-sm"
          value={text}
          placeholder="Type or paste any emoji or symbol"
          aria-label="Custom mark"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              use(firstGrapheme(text));
              setText("");
            }
          }}
        />
        <button
          onClick={() => {
            use(firstGrapheme(text));
            setText("");
          }}
          disabled={!text.trim()}
          className="h-8 shrink-0 rounded-lg border border-primary/70 px-2 text-xs text-primary disabled:opacity-40"
        >
          Use
        </button>
      </div>
      {mine.length > 0 && (
        <div>
          <span className="text-[9px] tracking-wide text-muted-foreground uppercase">My marks · hold ✕ to delete</span>
          <div className="nw-scroll-x mt-0.5 flex gap-1.5 pb-0.5">
            {mine.map((m) => (
              <span key={m} className="flex shrink-0 items-center gap-0.5">
                <button
                  onClick={() => use(m)}
                  aria-label={`Use mark ${m}`}
                  className={`grid h-7 w-7 place-items-center rounded-lg border text-sm ${value === m ? "border-primary" : "border-border/60"}`}
                >
                  {m}
                </button>
                <HoldDelete label={`Delete mark ${m}`} onDelete={() => remove(m)} />
              </span>
            ))}
          </div>
        </div>
      )}
      {starters.length > 0 && (
        <div>
          <span className="text-[9px] tracking-wide text-muted-foreground uppercase">Starters</span>
          <div className="nw-scroll-x mt-0.5 flex gap-1 pb-0.5">
            {starters.map((m) => (
              <button
                key={m}
                onClick={() => use(m)}
                aria-label={`Use mark ${m}`}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-border/50 text-sm opacity-80"
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
