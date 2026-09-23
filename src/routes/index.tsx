import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import type { SlotId } from "@/lib/noteworthy/types";
import { useNoteworthy } from "@/lib/noteworthy/store";
import {
  bandMax,
  CENTER_GROW,
  growOf,
  heightOf,
  LOWER_BAND,
  SIDE_GROW,
  tierOf,
  UPPER_BAND,
} from "@/lib/noteworthy/layout";
import { FacetSurface } from "@/components/noteworthy/FacetSurface";
import { FacetFront } from "@/components/noteworthy/FacetFront";
import { FacetOverlay } from "@/components/noteworthy/FacetOverlay";
import { DataSafetyPanel } from "@/components/noteworthy/DataSafetyPanel";
import { RepositoryBar } from "@/components/noteworthy/RepositoryBar";
import { RepositoryWorkspace } from "@/components/noteworthy/RepositoryWorkspace";
import { CaptureBar } from "@/components/noteworthy/CaptureBar";
import { CaptureWorkspace } from "@/components/noteworthy/CaptureWorkspace";
import { UtilityStage } from "@/components/noteworthy/UtilityStage";
import { useUtility } from "@/lib/noteworthy/utility-store";
import { rectOf, type Rect } from "@/lib/noteworthy/transform";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Noteworthy — A Living Visual Map of Attention" },
      {
        name: "description",
        content:
          "Noteworthy is a spatial attention interface where position, size and depth show what matters most at a glance.",
      },
      { property: "og:title", content: "Noteworthy — A Living Visual Map of Attention" },
      {
        property: "og:description",
        content:
          "Attention has shape. A portrait-first spatial field with a fixed visual hierarchy.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Field,
});

function Field() {
  const {
    state,
    savedAt: fieldSavedAt,
    updateFacet,
    touchFacet,
    updateSettings,
    reset,
    reloadFromStorage,
  } = useNoteworthy();
  const api = useUtility();
  const [selected, setSelected] = useState<{ id: SlotId; rect: Rect } | null>(null);
  const [util, setUtil] = useState<{ id: "UTIL_TOP" | "UTIL_BOTTOM"; rect: Rect } | null>(null);
  const [showControls, setShowControls] = useState(false);
  const f = state.facets;
  const amb = state.settings.ambientMotion;
  const reduced = state.settings.reducedMotion;

  const openUtil = (id: "UTIL_TOP" | "UTIL_BOTTOM", el: HTMLElement) => {
    touchFacet(id);
    setUtil({ id, rect: rectOf(el) });
  };

  const open = (id: SlotId, el: HTMLElement) => {
    touchFacet(id);
    setSelected({ id, rect: rectOf(el) });
  };

  const band = (ids: SlotId[]) => {
    const max = bandMax(ids);
    return ids.map((id) => ({ id, grow: growOf(id), h: heightOf(id, max) }));
  };

  const Tile = ({
    id,
    style,
    scale,
  }: {
    id: SlotId;
    style?: React.CSSProperties;
    scale?: "xl" | "lg" | "md" | "sm";
  }) => (
    <button
      onClick={(e) => open(id, e.currentTarget)}
      data-testid={`nw-tile-${id}`}
      aria-label={`${f[id].title} — ${f[id].positionName}`}
      className={cn(
        "group relative block min-w-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        selected && selected.id !== id && "nw-recede",
        selected && selected.id === id && "nw-source-hidden",
      )}
      style={style}
    >
      <FacetSurface
        facet={f[id]}
        ambient={amb}
        className="h-full w-full text-left active:scale-[0.98]"
        float={!state.settings.reducedMotion}
      >
        <FacetFront facet={f[id]} scale={scale ?? tierOf(id)} />
      </FacetSurface>
    </button>
  );

  const upper = band(UPPER_BAND);
  const lower = band(LOWER_BAND);
  const latestSavedAt =
    [fieldSavedAt, api.savedAt]
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1) ?? null;

  return (
    <main
      className={cn(
        "nw-deepspace relative h-[100dvh] w-full overflow-hidden",
        state.settings.reducedMotion && "nw-reduced",
      )}
    >
      <div
        className={cn("nw-field-effect", `fx-${state.settings.fieldEffect}`)}
        style={{ ["--field-intensity" as string]: state.settings.depth / 100 }}
        aria-hidden
      />

      <h1 className="sr-only">Noteworthy — spatial attention field</h1>

      <div className="relative z-10 mx-auto flex h-full w-full max-w-[520px] flex-col gap-1.5 p-2">
        {/* ROW 1 — upper utility bar: Prompt & Conversation Repository */}
        <div style={{ flex: "0 0 5%" }}>
          <RepositoryBar
            facet={f.UTIL_TOP}
            utility={api.utility}
            ambient={amb}
            reduced={reduced}
            onOpen={(el) => openUtil("UTIL_TOP", el)}
            recede={Boolean(util && util.id !== "UTIL_TOP") || Boolean(selected)}
            hidden={util?.id === "UTIL_TOP"}
          />
        </div>

        {/* ROW 2 — upper band */}
        <div className="flex items-center gap-1.5" style={{ flex: "1 1 21%" }}>
          {upper.map((t) => (
            <Tile
              key={t.id}
              id={t.id}
              style={{ flexGrow: t.grow, flexBasis: 0, height: `${t.h}%` }}
            />
          ))}
        </div>

        {/* ROW 3 — center band */}
        <div className="flex items-stretch gap-1.5" style={{ flex: "1 1 40%" }}>
          <div
            className="flex flex-col justify-center gap-1.5"
            style={{ flexGrow: SIDE_GROW, flexBasis: 0 }}
          >
            <Tile id="UL" style={{ flex: "1 1 0", minHeight: 0 }} />
            <Tile id="LL" style={{ flex: "1 1 0", minHeight: 0 }} />
          </div>
          <div className="grid place-items-stretch" style={{ flexGrow: CENTER_GROW, flexBasis: 0 }}>
            <Tile id="C" style={{ height: "100%" }} />
          </div>
          <div
            className="flex flex-col justify-center gap-1.5"
            style={{ flexGrow: SIDE_GROW, flexBasis: 0 }}
          >
            <Tile id="UR" style={{ flex: "1 1 0", minHeight: 0 }} />
            <Tile id="LR" style={{ flex: "1 1 0", minHeight: 0 }} />
          </div>
        </div>

        {/* ROW 4 — lower band */}
        <div className="flex items-center gap-1.5" style={{ flex: "1 1 21%" }}>
          {lower.map((t) => (
            <Tile
              key={t.id}
              id={t.id}
              style={{ flexGrow: t.grow, flexBasis: 0, height: `${t.h}%` }}
            />
          ))}
        </div>

        {/* ROW 5 — lower utility bar: Auto-Saving Capture Dock */}
        <div style={{ flex: "0 0 5%" }}>
          <CaptureBar
            facet={f.UTIL_BOTTOM}
            utility={api.utility}
            ambient={amb}
            reduced={reduced}
            onOpen={(el) => openUtil("UTIL_BOTTOM", el)}
            onDraft={api.setDraft}
            onSaveDefault={(text) => {
              const ids = api.utility.defaultTabIds.length
                ? api.utility.defaultTabIds
                : [api.utility.tabs[0]!.id];
              ids.forEach((tabId) =>
                api.addClip(tabId, {
                  title: text.trim().split("\n")[0]!.slice(0, 60) || "Capture",
                  body: text,
                }),
              );
              api.commitHistory(text);
              api.clearDraft();
            }}
            recede={Boolean(util && util.id !== "UTIL_BOTTOM") || Boolean(selected)}
            hidden={util?.id === "UTIL_BOTTOM"}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowControls(true)}
        data-testid="nw-field-data"
        aria-label="Open field and data controls"
        className="absolute right-3 bottom-[6.2%] z-20 rounded-full border border-primary/50 bg-background/90 px-3 py-1.5 text-[10px] tracking-[0.14em] uppercase shadow-lg backdrop-blur hover:bg-primary/15"
      >
        Field &amp; data
      </button>

      {util && (
        <UtilityStage
          key={util.id}
          facet={f[util.id]}
          sourceRect={util.rect}
          reduced={reduced}
          testId={util.id === "UTIL_TOP" ? "nw-repo-workspace" : "nw-capture-workspace"}
          onClose={() => setUtil(null)}
        >
          {(close) =>
            util.id === "UTIL_TOP" ? (
              <RepositoryWorkspace api={api} onClose={close} />
            ) : (
              <CaptureWorkspace api={api} onClose={close} />
            )
          }
        </UtilityStage>
      )}

      {selected && (
        <FacetOverlay
          key={selected.id}
          facet={f[selected.id]}
          settings={state.settings}
          sourceRect={selected.rect}
          onPatch={(patch) => updateFacet(selected.id, patch)}
          onClose={() => setSelected(null)}
        />
      )}

      {showControls && (
        <DataSafetyPanel
          savedAt={latestSavedAt}
          settings={state.settings}
          onSettings={updateSettings}
          onReload={() => {
            reloadFromStorage();
            api.reloadFromStorage();
          }}
          onReset={reset}
          onClose={() => setShowControls(false)}
        />
      )}
    </main>
  );
}
