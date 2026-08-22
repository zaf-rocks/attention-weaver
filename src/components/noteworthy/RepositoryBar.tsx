import type { Facet } from "@/lib/noteworthy/types";
import type { UtilityState } from "@/lib/noteworthy/utility-types";
import { FacetSurface } from "./FacetSurface";

/** Thin cockpit summary of the prompt repository. Tap anywhere to unfold it. */
export function RepositoryBar({
  facet,
  utility,
  ambient,
  reduced,
  onOpen,
  className,
  recede,
  hidden,
}: {
  facet: Facet;
  utility: UtilityState;
  ambient: number;
  reduced: boolean;
  onOpen: (el: HTMLElement) => void;
  className?: string;
  recede?: boolean;
  hidden?: boolean;
}) {
  const chips = utility.tabs.slice(0, 6);
  return (
    <button
      type="button"
      data-testid="nw-util-top"
      aria-label={`Prompt Repository — ${utility.tabs.length} tabs, ${utility.clips.length} clips. Open repository`}
      onClick={(e) => onOpen(e.currentTarget)}
      className={`group block h-full w-full min-w-0 text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${recede ? "nw-recede" : ""} ${hidden ? "nw-source-hidden" : ""} ${className ?? ""}`}
    >
      <FacetSurface facet={facet} ambient={ambient} className="h-full w-full" float={!reduced}>
        <div className="relative z-[3] flex h-full min-w-0 items-center gap-2 px-2.5">
          <span className="shrink-0 text-[12px] opacity-80" aria-hidden>
            ❖
          </span>
          <span className="shrink-0 truncate font-display text-[9.5px] font-semibold tracking-[0.16em] uppercase">
            <span className="hidden xs:inline">Prompt Repository</span>
            <span className="xs:hidden">Prompt Repo</span>
          </span>
          <span className="hidden min-w-0 items-center gap-1 sm:flex" aria-hidden>
            {chips.map((t) => (
              <span
                key={t.id}
                className="rounded border border-border/70 px-1 text-[8px] tracking-widest text-muted-foreground"
              >
                {t.code}
              </span>
            ))}
          </span>
          <span className="ml-auto shrink-0 text-[8.5px] tracking-widest text-muted-foreground uppercase">
            {utility.tabs.length} tabs · {utility.clips.length} clips
          </span>
          <span className="shrink-0 text-[10px] opacity-70" aria-hidden>
            ⤢
          </span>
        </div>
      </FacetSurface>
    </button>
  );
}
