import type { Facet } from "@/lib/noteworthy/types";
import { cn } from "@/lib/utils";

type Scale = "xl" | "lg" | "md" | "sm" | "bar";

/** Title size scales with the facet itself (container units) so it fills the face. */
const TITLE_CQ: Record<Exclude<Scale, "bar">, string> = {
  xl: "clamp(18px, 11cqi, 44px)",
  lg: "clamp(13px, 14.5cqi, 30px)",
  md: "clamp(11px, 16cqi, 24px)",
  sm: "clamp(9.5px, 17cqi, 18px)",
};

const TYPE: Record<Scale, { title: string; tag: string; icon: string }> = {
  xl: { title: "text-[15px]", tag: "text-[10px]", icon: "text-[28px]" },
  lg: { title: "text-[12px]", tag: "text-[9px]", icon: "text-[19px]" },
  md: { title: "text-[10.5px]", tag: "text-[8px]", icon: "text-[15px]" },
  sm: { title: "text-[9px]", tag: "text-[7px]", icon: "text-[12px]" },
  bar: { title: "text-[10px]", tag: "text-[9px]", icon: "text-[12px]" },
};

/** Clean front face: title, short description, mark, concise status. No codes, no percentages. */
export function FacetFront({ facet, scale }: { facet: Facet; scale: Scale }) {
  const t = TYPE[scale];
  const due = facet.due ? new Date(facet.due) : null;
  const countTasks = (list: Facet["tasks"]): number =>
    list.reduce((n, x) => n + (x.done ? 0 : 1) + countTasks(x.subtasks), 0);
  const openTasks = countTasks(facet.tasks);
  const blurb = facet.description.split("\n")[0] ?? "";

  if (scale === "bar") {
    return (
      <div className="relative z-[3] flex h-full min-w-0 items-center gap-2 px-3">
        <span className={cn(t.icon, "shrink-0 opacity-80")} aria-hidden>
          {facet.icon}
        </span>
        <span className={cn(t.title, "truncate font-semibold tracking-[0.16em] uppercase")}>
          {facet.title}
        </span>
        <span className={cn(t.tag, "ml-auto shrink-0 truncate text-muted-foreground")}>
          {blurb}
        </span>
      </div>
    );
  }

  return (
    <div
      className="relative z-[3] flex h-full min-w-0 flex-col justify-between p-1.5"
      style={{ containerType: "size" }}
    >
      <div className="flex min-w-0 items-start gap-1">
        <span
          className={cn(t.icon, "shrink-0 leading-none opacity-90")}
          style={{ filter: "drop-shadow(0 0 6px var(--per-a))" }}
          aria-hidden
        >
          {facet.icon}
        </span>
        {facet.complete && (
          <span className="ml-auto shrink-0 text-[8px] tracking-widest text-primary uppercase">
            done
          </span>
        )}
      </div>

      <div className="min-w-0">
        <h3
          className={cn(
            "nw-title line-clamp-3 font-display leading-[1.02] font-bold tracking-tight break-words",
            facet.complete && "line-through opacity-60",
          )}
          style={{ fontSize: TITLE_CQ[scale] }}
        >
          {facet.title}
        </h3>
        {scale !== "sm" && (
          <p className={cn(t.tag, "line-clamp-2 text-muted-foreground")}>{blurb}</p>
        )}
      </div>

      {scale !== "sm" && (
        <div className={cn("flex min-w-0 items-center gap-1.5 text-[8px] text-muted-foreground")}>
          {openTasks > 0 && <span className="shrink-0">{openTasks} open</span>}
          {due && (
            <span className="truncate">
              {due.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
