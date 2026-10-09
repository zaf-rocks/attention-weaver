import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import type { SlotId } from "@/lib/noteworthy/types";
import { POSITION_NAMES } from "@/lib/noteworthy/initial";
import { useNoteworthy } from "@/lib/noteworthy/store";
import { useHub } from "@/lib/noteworthy/hub-store";
import { useBoard } from "@/lib/noteworthy/board-store";
import {
  CENTER_GROW,
  LOWER_BAND,
  SIDE_GROW,
  UPPER_BAND,
  bandMax,
  growOf,
  heightOf,
  tierOf,
} from "@/lib/noteworthy/layout";
import { FacetSurface } from "@/components/noteworthy/FacetSurface";
import { FacetFront } from "@/components/noteworthy/FacetFront";
import { FacetOverlay } from "@/components/noteworthy/FacetOverlay";
import { HubBar } from "@/components/noteworthy/HubBar";
import { HubWorkspace } from "@/components/noteworthy/HubWorkspace";
import { BoardBar } from "@/components/noteworthy/BoardBar";
import { BoardWorkspace } from "@/components/noteworthy/BoardWorkspace";
import { UtilityStage } from "@/components/noteworthy/UtilityStage";
import { SpaceSwitcher } from "@/components/noteworthy/SpaceSwitcher";
import { FieldControls } from "@/components/noteworthy/FieldControls";
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
        content: "Attention has shape. A spatial field of fixed-hierarchy facets.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Field,
});

type UtilId = "UTIL_TOP" | "UTIL_BOTTOM";

function Field() {
  const {
    state, savedAt, updateFacet, touchFacet, updateSettings, reset, reloadFromStorage,
    spaces, switchSpace, createSpace, renameSpace, deleteSpace,
  } = useNoteworthy();
  const hubApi = useHub();
  const boardApi = useBoard();
  const [selected, setSelected] = useState<{ id: SlotId; rect: Rect } | null>(null);
  const [util, setUtil] = useState<{ id: UtilId; rect: Rect } | null>(null);
  const [controls, setControls] = useState(false);
  const f = state.facets;
  const amb = state.settings.ambientMotion;
  const reduced = state.settings.reducedMotion;

  const openUtil = (id: UtilId, el: HTMLElement) => {
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

  const Tile = ({ id, style }: { id: SlotId; style?: React.CSSProperties }) => (
    <button
      onClick={(e) => open(id, e.currentTarget)}
      data-testid={`nw-tile-${id}`}
      aria-label={`${f[id].title} — ${f[id].positionName || POSITION_NAMES[id]}`}
      className={cn(
        "group relative block min-w-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        (selected || util) && selected?.id !== id && "nw-recede",
        selected && selected.id === id && "nw-source-hidden",
      )}
      style={style}
    >
      <FacetSurface
        facet={f[id]}
        ambient={amb}
        className="h-full w-full text-left active:scale-[0.98]"
        float={!reduced}
      >
        <FacetFront facet={f[id]} scale={tierOf(id)} />
      </FacetSurface>
    </button>
  );

  const upper = band(UPPER_BAND);
  const lower = band(LOWER_BAND);
  const busy = Boolean(selected) || Boolean(util);

  return (
    <main
      className={cn(
        "nw-deepspace relative h-[100dvh] w-full overflow-hidden",
        reduced && "nw-reduced",
      )}
    >
      <div
        className={cn("nw-field-effect", `fx-${state.settings.fieldEffect}`)}
        style={{ ["--field-intensity" as string]: state.settings.depth / 100 }}
        aria-hidden
      />

      <h1 className="sr-only">Noteworthy — spatial attention field</h1>

      <div className="nw-field relative z-10 mx-auto flex h-full w-full flex-col gap-1.5 p-2">
        <div className="flex gap-1.5" style={{ flex: "0 0 5%" }}>
          <div className="min-w-0 flex-1">
            <HubBar
              facet={f.UTIL_TOP}
              hub={hubApi.hub}
              ambient={amb}
              reduced={reduced}
              onOpen={(el) => openUtil("UTIL_TOP", el)}
              onQuickChange={hubApi.setQuick}
              onQuickCommit={hubApi.commitQuick}
              recede={busy && util?.id !== "UTIL_TOP"}
              hidden={util?.id === "UTIL_TOP"}
            />
          </div>
          <SpaceSwitcher
            spaces={spaces}
            onSwitch={(id) => {
              setSelected(null);
              setUtil(null);
              switchSpace(id);
            }}
            onCreate={createSpace}
            onRename={renameSpace}
            onDelete={deleteSpace}
          />
          <button
            type="button"
            onClick={() => setControls(true)}
            aria-label="Field settings and data safety"
            data-testid="nw-open-controls"
            className="grid aspect-square h-full shrink-0 place-items-center rounded-lg border border-border/60 bg-card/50 text-[12px] text-muted-foreground hover:text-foreground"
          >
            ⚙
          </button>
        </div>

        <div className="flex items-center gap-1.5" style={{ flex: "1 1 21%" }}>
          {upper.map((t) => (
            <Tile key={t.id} id={t.id} style={{ flexGrow: t.grow, flexBasis: 0, height: `${t.h}%` }} />
          ))}
        </div>

        <div className="flex items-stretch gap-1.5" style={{ flex: "1 1 40%" }}>
          <div className="flex flex-col justify-center gap-1.5" style={{ flexGrow: SIDE_GROW, flexBasis: 0 }}>
            <Tile id="UL" style={{ flex: "1 1 0", minHeight: 0 }} />
            <Tile id="LL" style={{ flex: "1 1 0", minHeight: 0 }} />
          </div>
          <div className="grid place-items-stretch" style={{ flexGrow: CENTER_GROW, flexBasis: 0 }}>
            <Tile id="C" style={{ height: "100%" }} />
          </div>
          <div className="flex flex-col justify-center gap-1.5" style={{ flexGrow: SIDE_GROW, flexBasis: 0 }}>
            <Tile id="UR" style={{ flex: "1 1 0", minHeight: 0 }} />
            <Tile id="LR" style={{ flex: "1 1 0", minHeight: 0 }} />
          </div>
        </div>

        <div className="flex items-center gap-1.5" style={{ flex: "1 1 21%" }}>
          {lower.map((t) => (
            <Tile key={t.id} id={t.id} style={{ flexGrow: t.grow, flexBasis: 0, height: `${t.h}%` }} />
          ))}
        </div>

        <div style={{ flex: "0 0 5%" }}>
          <BoardBar
            facet={f.UTIL_BOTTOM}
            board={boardApi.board}
            ambient={amb}
            reduced={reduced}
            onOpen={(el) => openUtil("UTIL_BOTTOM", el)}
            onQuickChange={boardApi.setQuick}
            onQuickCommit={boardApi.commitQuick}
            recede={busy && util?.id !== "UTIL_BOTTOM"}
            hidden={util?.id === "UTIL_BOTTOM"}
          />
        </div>
      </div>

      {util && (
        <UtilityStage
          key={util.id}
          facet={f[util.id]}
          sourceRect={util.rect}
          reduced={reduced}
          testId={util.id === "UTIL_TOP" ? "nw-repo-workspace" : "nw-board-workspace"}
          onClose={() => setUtil(null)}
        >
          {(close) =>
            util.id === "UTIL_TOP" ? (
              <HubWorkspace
                api={hubApi}
                facet={f.UTIL_TOP}
                onPatchFacet={(p) => updateFacet("UTIL_TOP", p)}
                onClose={close}
              />
            ) : (
              <BoardWorkspace
                api={boardApi}
                facet={f.UTIL_BOTTOM}
                onPatchFacet={(p) => updateFacet("UTIL_BOTTOM", p)}
                onClose={close}
              />
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

      {controls && (
        <FieldControls
          settings={state.settings}
          savedAt={savedAt}
          onSettings={updateSettings}
          onReset={reset}
          onReloaded={() => {
            reloadFromStorage();
            hubApi.reloadHub();
            boardApi.reloadBoard();
          }}
          onClose={() => setControls(false)}
        />
      )}
    </main>
  );
}
