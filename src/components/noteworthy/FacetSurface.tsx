import type { CSSProperties, ReactNode } from "react";
import type { Facet } from "@/lib/noteworthy/types";
import { cn } from "@/lib/utils";

export function facetVars(facet: Facet, ambient: number): CSSProperties {
  return {
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
