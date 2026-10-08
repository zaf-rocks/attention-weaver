import type { CSSProperties, ReactNode } from "react";
import type { Facet } from "@/lib/noteworthy/types";
import { cn } from "@/lib/utils";

const grad = (deg: number, g: Facet["body"]) =>
  `linear-gradient(${deg}deg, ${(g.stops && g.stops.length >= 3 ? g.stops : [g.a, g.b]).join(", ")})`;

export function facetVars(facet: Facet, ambient: number): CSSProperties {
  const text = facet.text;
  return {
    ["--body-img" as string]: grad(155, facet.body),
    ["--per-img" as string]: grad(135, facet.perimeter),
    ["--title-a" as string]: text ? text.a : "oklch(0.98 0.01 260)",
    ["--title-b" as string]: text ? text.b : facet.perimeter.b,
    ...(text?.stops && text.stops.length >= 3 ? { ["--title-img" as string]: grad(100, text) } : {}),
    ["--body-a" as string]: facet.body.a,
    ["--body-b" as string]: facet.body.b,
    ["--per-a" as string]: facet.perimeter.a,
    ["--per-b" as string]: facet.perimeter.b,
    ["--glow" as string]: facet.glow / 100,
    ["--speed" as string]: facet.effectSpeed / 100,
    ["--amb" as string]: (ambient / 100) * (facet.motion / 100) * 1.6,
  } as CSSProperties;
}

/** Shared effect layers: interior body effect + perimeter effect (+ optional color shift). */
export function FacetLayers({ facet }: { facet: Facet }) {
  return (
    <>
      <div className="nw-body-fx" aria-hidden />
      <div
        className={cn("nw-perimeter", `pfx-${facet.perimeterEffect}`, facet.colorShift && "pfx-shift")}
        aria-hidden
      />
    </>
  );
}

export const bodyClass = (facet: Facet) => `bfx-${facet.bodyEffect ?? "none"}`;

/** Dark translucent holographic surface with a thin luminous perimeter. */
export function FacetSurface({
  facet,
  ambient,
  className,
  style,
  children,
  float = true,
}: {
  facet: Facet;
  ambient: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  float?: boolean;
}) {
  return (
    <div
      className={cn("nw-facet", bodyClass(facet), float && "nw-float", className)}
      style={{ ...facetVars(facet, ambient), ...style }}
    >
      <FacetLayers facet={facet} />
      {children}
    </div>
  );
}
